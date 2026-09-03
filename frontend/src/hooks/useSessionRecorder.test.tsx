import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FrameResultMessage } from '../types'
import { SessionRecorderProvider, useSessionRecorder } from './useSessionRecorder'

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionRecorderProvider>{children}</SessionRecorderProvider>
)

function result(over: Partial<FrameResultMessage>): FrameResultMessage {
  return {
    type: 'result',
    gesture: 'fist',
    confidence: 0.9,
    hand_present: true,
    handedness: null,
    landmarks: null,
    scores: {},
    inference_ms: 10,
    frames_dropped: 0,
    ...over,
  }
}

beforeEach(() => vi.useFakeTimers({ toFake: ['performance', 'Date'] }))
afterEach(() => vi.useRealTimers())

describe('useSessionRecorder', () => {
  it('records a sample, throttled to ~5/s', () => {
    const { result: hook } = renderHook(() => useSessionRecorder(), { wrapper })

    act(() => hook.current.record(result({})))
    act(() => hook.current.record(result({}))) // within 180ms -> dropped
    expect(hook.current.samples).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(200)
      hook.current.record(result({}))
    })
    expect(hook.current.samples).toHaveLength(2)
  })

  it('stores null for a frame with no hand', () => {
    const { result: hook } = renderHook(() => useSessionRecorder(), { wrapper })
    act(() => hook.current.record(result({ hand_present: false, gesture: null })))
    expect(hook.current.samples[0].gesture).toBeNull()
  })

  it('clear() empties the session', () => {
    const { result: hook } = renderHook(() => useSessionRecorder(), { wrapper })
    act(() => hook.current.record(result({})))
    act(() => hook.current.clear())
    expect(hook.current.samples).toHaveLength(0)
  })
})
