// Turns the current frame of a <video> element into compressed JPEG bytes ready
// to send over the WebSocket.
//
// Why downscale + compress in the browser: the backend only needs a small image
// for landmark detection, and a ~15 KB JPEG travels far faster than a full-res
// frame. One reusable <canvas> does the work (allocating one per frame would
// thrash memory at 10 fps).

export interface CaptureOptions {
  /** Longest edge of the sent frame, in pixels. */
  maxWidth?: number
  /** JPEG quality 0..1. */
  quality?: number
}

const DEFAULTS: Required<CaptureOptions> = { maxWidth: 320, quality: 0.7 }

/** Pure helper: the output size that fits `maxWidth` while keeping aspect ratio. */
export function computeCaptureSize(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
): { width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) return { width: 0, height: 0 }
  if (sourceWidth <= maxWidth) {
    return { width: Math.round(sourceWidth), height: Math.round(sourceHeight) }
  }
  const scale = maxWidth / sourceWidth
  return { width: maxWidth, height: Math.max(1, Math.round(sourceHeight * scale)) }
}

export interface FrameCapturer {
  capture(video: HTMLVideoElement): Promise<Blob | null>
}

/**
 * Creates a capturer holding one reusable canvas. `capture()` resolves to a JPEG
 * Blob, or null when the video has no frame yet (not ready / zero-sized).
 */
export function createFrameCapturer(options: CaptureOptions = {}): FrameCapturer {
  const { maxWidth, quality } = { ...DEFAULTS, ...options }
  const canvas = document.createElement('canvas')

  return {
    capture(video) {
      const sourceWidth = video.videoWidth
      const sourceHeight = video.videoHeight
      if (video.readyState < 2 || sourceWidth === 0 || sourceHeight === 0) {
        return Promise.resolve(null)
      }

      const { width, height } = computeCaptureSize(sourceWidth, sourceHeight, maxWidth)
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) return Promise.resolve(null)
      ctx.drawImage(video, 0, 0, width, height)

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
      })
    },
  }
}
