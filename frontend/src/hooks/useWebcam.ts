import { useCallback, useEffect, useRef, useState } from 'react'

// Owns webcam access via the browser's getUserMedia API.
//
// getUserMedia only works in a "secure context" (https:// or localhost) and can
// fail in several distinct ways the UI should treat differently:
//   denied      - the user (or a policy) refused permission
//   notFound    - no camera on the device
//   inUse       - the camera is held by another app
//   unavailable - the API itself is missing (insecure context / old browser)

export type WebcamStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'notFound'
  | 'inUse'
  | 'unavailable'
  | 'error'

interface UseWebcamResult {
  status: WebcamStatus
  stream: MediaStream | null
  errorDetail: string | null
  start: () => Promise<void>
  stop: () => void
}

const CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
  audio: false,
}

function classifyError(err: unknown): { status: WebcamStatus; detail: string } {
  const name = err instanceof DOMException ? err.name : ''
  const detail = err instanceof Error ? err.message : String(err)
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return { status: 'denied', detail }
    case 'NotFoundError':
    case 'OverconstrainedError':
      return { status: 'notFound', detail }
    case 'NotReadableError':
    case 'AbortError':
      return { status: 'inUse', detail }
    default:
      return { status: 'error', detail }
  }
}

export function useWebcam(): UseWebcamResult {
  const [status, setStatus] = useState<WebcamStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      setErrorDetail('Camera API not available. Use https:// or localhost in a modern browser.')
      return
    }

    setStatus('requesting')
    setErrorDetail(null)
    try {
      const media = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
      streamRef.current = media
      setStream(media)
      setStatus('active')

      // If the OS drops the device (unplugged, taken by another app), react.
      media.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (streamRef.current === media) {
            streamRef.current = null
            setStream(null)
            setStatus('inUse')
            setErrorDetail('The camera stopped unexpectedly.')
          }
        })
      })
    } catch (err) {
      const { status: s, detail } = classifyError(err)
      setStatus(s)
      setErrorDetail(detail)
    }
  }, [])

  // Release the camera if the component using the hook unmounts.
  useEffect(() => stop, [stop])

  return { status, stream, errorDetail, start, stop }
}
