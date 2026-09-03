import { useCallback, useEffect, useRef, useState } from 'react'

import { config } from '../config'
import type { FrameResultMessage, ReadyMessage, ServerMessage } from '../types'

// Owns the WebSocket to the backend's /ws endpoint.
//
// Responsibilities:
//   * open the socket when `enabled` turns true, close it when it turns false
//   * after the server's "ready" message, send one captured frame on a timer,
//     throttled to `targetFps` (falling back to the server's recommendation)
//   * never let two captures overlap (skip a tick if the previous is still going)
//   * push classifier-tuning ({"type":"config"}) whenever `minConfidence` changes
//   * expose the latest result / error / reconnection attempt for the UI
//   * auto-reconnect with exponential backoff if the connection drops while enabled
//
// The connection machinery lives in one effect keyed on `enabled`; `targetFps`
// and `minConfidence` are read through refs so changing them does not tear the
// socket down.

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
  targetFps?: number
  minConfidence?: number
}

interface UseGestureSocketResult {
  status: SocketStatus
  ready: ReadyMessage | null
  lastResult: FrameResultMessage | null
  lastError: string | null
  reconnectAttempt: number
  sendReset: () => void
}

const MAX_BACKOFF_MS = 8000
const DEFAULT_FPS = 10
const MIN_INTERVAL_MS = 40

export function useGestureSocket({
  enabled,
  captureFrame,
  targetFps,
  minConfidence,
}: UseGestureSocketOptions): UseGestureSocketResult {
  const [status, setStatus] = useState<SocketStatus>('idle')
  const [ready, setReady] = useState<ReadyMessage | null>(null)
  const [lastResult, setLastResult] = useState<FrameResultMessage | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  const captureRef = useRef(captureFrame)
  const fpsRef = useRef(targetFps)
  const minConfRef = useRef(minConfidence)
  useEffect(() => {
    captureRef.current = captureFrame
    fpsRef.current = targetFps
    minConfRef.current = minConfidence
  }, [captureFrame, targetFps, minConfidence])

  const socketRef = useRef<WebSocket | null>(null)

  const sendConfig = useCallback((value: number) => {
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'config', min_confidence: value }))
    }
  }, [])

  // Push a threshold change to an already-open socket.
  useEffect(() => {
    if (minConfidence != null) sendConfig(minConfidence)
  }, [minConfidence, sendConfig])

  useEffect(() => {
    if (!enabled) return

    let disposed = false
    let ws: WebSocket | null = null
    let sendTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0
    let inFlight = false
    let readySnapshot: ReadyMessage | null = null

    const intervalMs = () => {
      const fps = fpsRef.current ?? readySnapshot?.recommended_fps ?? DEFAULT_FPS
      return Math.max(1000 / Math.max(1, fps), MIN_INTERVAL_MS)
    }

    const stopSendLoop = () => {
      if (sendTimer !== null) {
        clearTimeout(sendTimer)
        sendTimer = null
      }
    }

    const tick = () => {
      const socket = ws
      if (!socket || socket.readyState !== WebSocket.OPEN) return
      if (inFlight) {
        sendTimer = setTimeout(tick, intervalMs())
        return
      }
      inFlight = true
      void captureRef
        .current()
        .then((blob) => {
          if (blob && socket.readyState === WebSocket.OPEN) socket.send(blob)
        })
        .finally(() => {
          inFlight = false
          if (!disposed) sendTimer = setTimeout(tick, intervalMs())
        })
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
        readySnapshot = message
        setReady(message)
        setStatus('live')
        if (minConfRef.current != null) sendConfig(minConfRef.current)
        stopSendLoop()
        tick()
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
        setReconnectAttempt(0)
      }
      ws.onmessage = handleMessage
      ws.onerror = () => setLastError('WebSocket connection error')
      ws.onclose = () => {
        stopSendLoop()
        if (disposed) return
        attempt += 1
        setReconnectAttempt(attempt)
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
      setReconnectAttempt(0)
    }
  }, [enabled, sendConfig])

  const sendReset = useCallback(() => {
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reset' }))
    }
    setLastResult(null)
  }, [])

  return { status, ready, lastResult, lastError, reconnectAttempt, sendReset }
}
