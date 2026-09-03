import { useCallback, useEffect, useRef, useState } from 'react'

import { CameraView } from '../components/CameraView'
import { GesturePanel } from '../components/GesturePanel'
import { PageContainer } from '../components/PageContainer'
import { SessionStats } from '../components/SessionStats'
import { useGestureSocket } from '../hooks/useGestureSocket'
import { useGestures } from '../hooks/useGestures'
import { useWebcam } from '../hooks/useWebcam'
import { createFrameCapturer } from '../lib/frameCapture'
import { clearCanvas, drawLandmarks } from '../lib/drawLandmarks'

// Orchestrates the live experience:
//   webcam stream -> capture a frame -> WebSocket -> gesture result -> UI + overlay
//
// Each concern lives in its own hook/lib; this component only wires them together
// and owns the small bits of session state (fps estimate, detection count).

export function LivePage() {
  const { gestures } = useGestures()
  const webcam = useWebcam()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const capturerRef = useRef(createFrameCapturer({ maxWidth: 320, quality: 0.7 }))

  const [running, setRunning] = useState(false)
  const active = running && webcam.status === 'active'

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    return video ? capturerRef.current.capture(video) : Promise.resolve(null)
  }, [])

  const { status: socketStatus, lastResult, lastError, sendReset } = useGestureSocket({
    enabled: active,
    captureFrame,
  })

  // --- session metrics -------------------------------------------------------
  const frameTimesRef = useRef<number[]>([])
  const prevGestureRef = useRef<string | null>(null)
  const [fps, setFps] = useState(0)
  const [detections, setDetections] = useState(0)

  useEffect(() => {
    if (!lastResult) return

    const now = performance.now()
    const times = frameTimesRef.current
    times.push(now)
    while (times.length > 0 && now - times[0] > 1000) times.shift()
    setFps(times.length)

    const g = lastResult.gesture
    if (g && g !== prevGestureRef.current) setDetections((n) => n + 1)
    if (g) prevGestureRef.current = g
  }, [lastResult])

  // --- skeleton overlay ----------------------------------------------------
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    if (active && lastResult?.landmarks) {
      drawLandmarks(ctx, lastResult.landmarks)
    } else {
      clearCanvas(ctx)
    }
  }, [lastResult, active])

  const reset = useCallback(() => {
    frameTimesRef.current = []
    prevGestureRef.current = null
    setDetections(0)
    setFps(0)
    sendReset()
  }, [sendReset])

  function handleToggle() {
    if (running) {
      setRunning(false)
      webcam.stop()
      reset()
    } else {
      setRunning(true)
      void webcam.start()
    }
  }

  return (
    <PageContainer
      title="Live recognition"
      lead="Turn on your webcam and GestureFlow streams the video to a Python backend that detects your hand and names the gesture in real time."
    >
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <CameraView
            videoRef={videoRef}
            overlayRef={overlayRef}
            stream={webcam.stream}
            status={webcam.status}
            errorDetail={webcam.errorDetail}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggle}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              {running ? 'Stop' : 'Start'}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={!active}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset
            </button>
            {lastError && socketStatus !== 'live' && (
              <span className="text-sm text-rose-600 dark:text-rose-400">{lastError}</span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <GesturePanel result={active ? lastResult : null} gestures={gestures} />
          <SessionStats
            socketStatus={running ? socketStatus : 'idle'}
            fps={fps}
            latencyMs={lastResult?.inference_ms ?? null}
            framesDropped={lastResult?.frames_dropped ?? 0}
            detections={detections}
          />
        </div>
      </div>
    </PageContainer>
  )
}
