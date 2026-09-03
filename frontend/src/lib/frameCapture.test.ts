import { afterEach, describe, expect, it, vi } from 'vitest'

import { computeCaptureSize, createFrameCapturer } from './frameCapture'

describe('computeCaptureSize', () => {
  it('leaves images already within maxWidth untouched', () => {
    expect(computeCaptureSize(300, 200, 320)).toEqual({ width: 300, height: 200 })
  })

  it('scales down proportionally when wider than maxWidth', () => {
    expect(computeCaptureSize(640, 480, 320)).toEqual({ width: 320, height: 240 })
  })

  it('never returns a zero height for a very wide source', () => {
    const { height } = computeCaptureSize(4000, 1, 320)
    expect(height).toBeGreaterThanOrEqual(1)
  })

  it('returns zero for a degenerate source', () => {
    expect(computeCaptureSize(0, 0, 320)).toEqual({ width: 0, height: 0 })
  })
})

describe('createFrameCapturer', () => {
  const drawImage = vi.fn()
  const toBlob = vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/jpeg' })))

  afterEach(() => {
    vi.restoreAllMocks()
    drawImage.mockClear()
    toBlob.mockClear()
  })

  function stubCanvas() {
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob,
    }
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement)
    return canvas
  }

  const fakeVideo = (over: Partial<HTMLVideoElement> = {}) =>
    ({ videoWidth: 640, videoHeight: 480, readyState: 4, ...over }) as HTMLVideoElement

  it('returns null when the video has no frame yet', async () => {
    stubCanvas()
    const capturer = createFrameCapturer()
    expect(await capturer.capture(fakeVideo({ readyState: 0 }))).toBeNull()
    expect(await capturer.capture(fakeVideo({ videoWidth: 0 }))).toBeNull()
  })

  it('draws the downscaled frame and returns a JPEG blob', async () => {
    const canvas = stubCanvas()
    const capturer = createFrameCapturer({ maxWidth: 320, quality: 0.7 })

    const blob = await capturer.capture(fakeVideo())

    expect(canvas.width).toBe(320)
    expect(canvas.height).toBe(240)
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 320, 240)
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.7)
    expect(blob).toBeInstanceOf(Blob)
  })
})
