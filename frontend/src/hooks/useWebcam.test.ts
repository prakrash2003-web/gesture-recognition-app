import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useWebcam } from './useWebcam'

function setGetUserMedia(impl: ((c: MediaStreamConstraints) => Promise<MediaStream>) | undefined) {
  vi.stubGlobal('navigator', {
    mediaDevices: impl ? { getUserMedia: vi.fn(impl) } : undefined,
  })
}

function fakeStream() {
  const track = { stop: vi.fn(), kind: 'video', addEventListener: vi.fn() }
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useWebcam', () => {
  it('goes active and exposes the stream on success', async () => {
    const stream = fakeStream()
    setGetUserMedia(() => Promise.resolve(stream))

    const { result } = renderHook(() => useWebcam())
    await act(async () => {
      await result.current.start()
    })

    expect(result.current.status).toBe('active')
    expect(result.current.stream).toBe(stream)
  })

  it('maps NotAllowedError to "denied"', async () => {
    setGetUserMedia(() => Promise.reject(new DOMException('no', 'NotAllowedError')))

    const { result } = renderHook(() => useWebcam())
    await act(async () => {
      await result.current.start()
    })

    expect(result.current.status).toBe('denied')
  })

  it('maps NotReadableError to "inUse"', async () => {
    setGetUserMedia(() => Promise.reject(new DOMException('busy', 'NotReadableError')))

    const { result } = renderHook(() => useWebcam())
    await act(async () => {
      await result.current.start()
    })

    expect(result.current.status).toBe('inUse')
  })

  it('reports "unavailable" when the API is missing (insecure context)', async () => {
    setGetUserMedia(undefined)

    const { result } = renderHook(() => useWebcam())
    await act(async () => {
      await result.current.start()
    })

    expect(result.current.status).toBe('unavailable')
  })

  it('stops all tracks on stop()', async () => {
    const stream = fakeStream()
    const track = stream.getTracks()[0]
    setGetUserMedia(() => Promise.resolve(stream))

    const { result } = renderHook(() => useWebcam())
    await act(async () => {
      await result.current.start()
    })
    act(() => result.current.stop())

    await waitFor(() => expect(track.stop).toHaveBeenCalled())
    expect(result.current.status).toBe('idle')
  })
})
