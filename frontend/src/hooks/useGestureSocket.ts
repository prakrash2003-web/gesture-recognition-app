import { useCallback, useEffect, useRef, useState } from 'react'

import { config } from '../config'
import type { FrameResultMessage, ReadyMessage, ServerMessage } from '../types'

// Owns the WebSocket to the backend's /ws endpoint.
//
// Responsibilities:
//   * open the socket when `enabled` turns true, close it when it turns false
//   * after the server's "ready" message, send one captured frame on a timer,
//     throttled to the fps the server asked for
//   * never let two captures overlap (skip a tick if the previous is still going)
//   * expose the latest result / error for the UI
//   * auto-reconnect with exponential backoff if the connection drops while enabled
//
// All the connection machinery lives inside one effect keyed on `enabled`, so the
// setup and teardown are a matched pair and there are no stale closures.

export type SocketStatus =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'closed'
  | 'error'

interface UseGestureSocketOptions {
  enabled: boolean
  captureFrame: () => Promise<Blob | null>
}

interface UseGestureSocketResult {
  status: SocketStatus
  ready: ReadyMessage | null
  lastResult: FrameResultMessage | null
  lastError: string | null
  sendReset: () => void
}

const MAX_BACKOFF_MS = 8000
const DEFAULT_FPS = 10
const MIN_INTERVAL_MS = 40

export function useGestureSocket({
  enabled,
  captureFrame,
}: UseGestureSocketOptions): UseGestureSocketResult {
  const [status, setStatus] = useState<SocketStatus>('idle')
  const [ready, setReady] = useState<ReadyMessage | null>(null)
  const [lastResult, setLastResult] = useState<FrameResultMessage | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  // Keep the newest capture function reachable from inside the effect without
  // making it an effect dependency (which would tear the socket down every frame).
  const captureRef = useRef(captureFrame)
  useEffect(() => {
    captureRef.current = captureFrame
  }, [captureFrame])

  // Exposed so the UI's "Reset" button can talk to the live socket.
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!enabled) return

    let disposed = false
    let ws: WebSocket | null = null
    let sendTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0
    let inFlight = false

    const stopSendLoop = () => {
      if (sendTimer !== null) {
        clearInterval(sendTimer)
        sendTimer = null
      }
    }

    const startSendLoop = (fps: number) => {
      stopSendLoop()
      const intervalMs = Math.max(1000 / Math.max(1, fps), MIN_INTERVAL_MS)
      sendTimer = setInterval(() => {
        const socket = ws
        if (!socket || socket.readyState !== WebSocket.OPEN || inFlight) return
        inFlight = true
        void captureRef
          .current()
          .then((blob) => {
            if (blob && socket.readyState === WebSocket.OPEN) socket.send(blob)
          })
          .finally(() => {
            inFlight = false
          })
      }, intervalMs)
    }

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return
      let message: ServerMessage
      try {
        message = JSON.parse(event.data) as ServerMessage
      } catch {
        return
      }
      if (message.type === 'ready') {
        setReady(message)
        setStatus('live')
        startSendLoop(message.recommended_fps || DEFAULT_FPS)
      } else if (message.type === 'result') {
        setLastResult(message)
      } else if (message.type === 'error') {
        setLastError(message.detail)
      }
    }

    const connect = () => {
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting')
      try {
        ws = new WebSocket(config.wsUrl)
      } catch (err) {
        setStatus('error')
        setLastError(err instanceof Error ? err.message : 'Could not open WebSocket')
        return
      }
      socketRef.current = ws

      ws.onopen = () => {
        attempt = 0
      }
      ws.onmessage = handleMessage
      ws.onerror = () => setLastError('WebSocket connection error')
      ws.onclose = () => {
        stopSendLoop()
        if (disposed) return
        attempt += 1
        const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS)
        setStatus('reconnecting')
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      disposed = true
      stopSendLoop()
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      const socket = ws
      ws = null
      socketRef.current = null
      if (socket) {
        socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close()
        }
      }
      setStatus('idle')
      setReady(null)
      setLastResult(null)
      setLastError(null)
    }
  }, [enabled])

  const sendReset = useCallback(() => {
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reset' }))
    }
    setLastResult(null)
  }, [])

  return { status, ready, lastResult, lastError, sendReset }
}
