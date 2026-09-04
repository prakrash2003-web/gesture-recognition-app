import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FrameResultMessage, ReadyMessage } from '../types'
import { useGestureSocket } from './useGestureSocket'

// --- a minimal fake WebSocket the tests can drive -----------------------------
class MockWebSocket {
  static instances: MockWebSocket[] = []
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  readyState = MockWebSocket.CONNECTING
  sent: unknown[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }
  send(data: unknown) {
    this.sent.push(data)
  }
  close() {
    if (this.readyState === MockWebSocket.CLOSED) return
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }
  simulateMessage(obj: unknown) {
    this.onmessage?.({ data: JSON.stringify(obj) })
  }
  simulateServerClose() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }
  static latest() {
    return MockWebSocket.instances.at(-1)!
  }
}

const READY: ReadyMessage = {
  type: 'ready',
  gestures: [],
  recommended_fps: 10,
  min_confidence: 0.7,
  classifier: 'rule',
  ml_available: false,
}
const RESULT: FrameResultMessage = {
  type: 'result',
  gesture: 'fist',
  confidence: 0.9,
  hand_present: true,
  handedness: 'Right',
  landmarks: null,
  scores: {},
  inference_ms: 12,
  frames_dropped: 0,
}

beforeEach(() => {
  MockWebSocket.instances = []
  vi.stubGlobal('WebSocket', MockWebSocket)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const capture = () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' }))

describe('useGestureSocket', () => {
  it('does not open a socket while disabled', () => {
    renderHook(() => useGestureSocket({ enabled: false, captureFrame: capture }))
    expect(MockWebSocket.instances).toHaveLength(0)
  })

  it('connects when enabled and goes live after the ready message', async () => {
    const { result } = renderHook(() =>
      useGestureSocket({ enabled: true, captureFrame: capture }),
    )
    expect(result.current.status).toBe('connecting')

    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
    })

    expect(result.current.status).toBe('live')
    expect(result.current.ready).toEqual(READY)
  })

  it('streams captured frames on a timer once live', async () => {
    vi.useFakeTimers()
    renderHook(() => useGestureSocket({ enabled: true, captureFrame: capture }))

    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350) // ~3 ticks at 10 fps
    })

    expect(MockWebSocket.latest().sent.filter((m) => m instanceof Blob).length).toBeGreaterThan(0)
  })

  it('exposes the latest result message', () => {
    const { result } = renderHook(() =>
      useGestureSocket({ enabled: true, captureFrame: capture }),
    )
    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
      MockWebSocket.latest().simulateMessage(RESULT)
    })
    expect(result.current.lastResult).toEqual(RESULT)
  })

  it('surfaces an error message without dropping the connection', () => {
    const { result } = renderHook(() =>
      useGestureSocket({ enabled: true, captureFrame: capture }),
    )
    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
      MockWebSocket.latest().simulateMessage({ type: 'error', detail: 'bad frame' })
    })
    expect(result.current.lastError).toBe('bad frame')
    expect(result.current.status).toBe('live')
  })

  it('reconnects after an unexpected close while still enabled', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useGestureSocket({ enabled: true, captureFrame: capture }),
    )
    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
    })

    act(() => MockWebSocket.latest().simulateServerClose())
    expect(result.current.status).toBe('reconnecting')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })
    expect(MockWebSocket.instances.length).toBeGreaterThan(1)
  })

  it('sends a config message with the threshold after ready', () => {
    renderHook(() =>
      useGestureSocket({ enabled: true, captureFrame: capture, minConfidence: 0.6 }),
    )
    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
    })
    const configs = MockWebSocket.latest()
      .sent.filter((m): m is string => typeof m === 'string')
      .map((m) => JSON.parse(m))
    expect(configs).toContainEqual({ type: 'config', min_confidence: 0.6 })
  })

  it('pushes a new threshold to an open socket when minConfidence changes', () => {
    const { rerender } = renderHook(
      ({ mc }) => useGestureSocket({ enabled: true, captureFrame: capture, minConfidence: mc }),
      { initialProps: { mc: 0.6 } },
    )
    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
    })
    rerender({ mc: 0.8 })
    const configs = MockWebSocket.latest()
      .sent.filter((m): m is string => typeof m === 'string')
      .map((m) => JSON.parse(m))
    expect(configs).toContainEqual({ type: 'config', min_confidence: 0.8 })
  })

  it('closes the socket when disabled', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useGestureSocket({ enabled, captureFrame: capture }),
      { initialProps: { enabled: true } },
    )
    act(() => {
      MockWebSocket.latest().simulateOpen()
      MockWebSocket.latest().simulateMessage(READY)
    })

    rerender({ enabled: false })
    await waitFor(() => expect(result.current.status).toBe('idle'))
    expect(MockWebSocket.latest().readyState).toBe(MockWebSocket.CLOSED)
  })
})
