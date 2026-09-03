import { useEffect, type RefObject } from 'react'

import type { WebcamStatus } from '../hooks/useWebcam'

// The video panel: the webcam feed with the hand-skeleton canvas layered on top,
// plus a message overlay for every non-active camera state. The parent owns the
// refs so it can also capture frames from the same <video>.

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>
  overlayRef: RefObject<HTMLCanvasElement | null>
  stream: MediaStream | null
  status: WebcamStatus
  errorDetail: string | null
  mirrored?: boolean
}

const MESSAGES: Partial<Record<WebcamStatus, { title: string; body: string }>> = {
  idle: { title: 'Camera off', body: 'Press Start to begin gesture recognition.' },
  requesting: {
    title: 'Requesting camera…',
    body: 'Your browser should ask for permission to use the webcam.',
  },
  denied: {
    title: 'Camera permission denied',
    body: 'Allow camera access in your browser’s site settings, then press Start again.',
  },
  notFound: {
    title: 'No camera found',
    body: 'Connect a webcam and try again.',
  },
  inUse: {
    title: 'Camera unavailable',
    body: 'Another app seems to be using the camera. Close it and press Start again.',
  },
  unavailable: {
    title: 'Camera not supported here',
    body: 'Open the site over https:// (or localhost) in a modern browser.',
  },
  error: { title: 'Could not start the camera', body: 'An unexpected error occurred.' },
}

export function CameraView({
  videoRef,
  overlayRef,
  stream,
  status,
  errorDetail,
  mirrored = true,
}: CameraViewProps) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    if (stream) void video.play().catch(() => undefined)
  }, [stream, videoRef])

  const message = status !== 'active' ? MESSAGES[status] : undefined
  const flip = mirrored ? '-scale-x-100' : ''

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
      <video
        ref={videoRef}
        playsInline
        muted
        className={`h-full w-full object-cover ${flip}`}
      />
      <canvas
        ref={overlayRef}
        className={`pointer-events-none absolute inset-0 h-full w-full ${flip}`}
      />

      {message && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/85 p-6 text-center">
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-white">{message.title}</p>
            <p className="mt-1 text-sm text-slate-400">{message.body}</p>
            {errorDetail && (status === 'error' || status === 'inUse') && (
              <p className="mt-2 font-mono text-xs text-slate-500">{errorDetail}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
