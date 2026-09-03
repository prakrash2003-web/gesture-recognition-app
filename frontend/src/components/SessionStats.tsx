import type { SocketStatus } from '../hooks/useGestureSocket'
import { Card } from './Card'

// Live numbers for the current session. `fps` is measured client-side (results
// received per second); `latencyMs` is the server's own reported inference time.

interface SessionStatsProps {
  socketStatus: SocketStatus
  fps: number
  latencyMs: number | null
  framesDropped: number
  detections: number
}

const SOCKET_LABEL: Record<SocketStatus, string> = {
  idle: 'Idle',
  connecting: 'Connecting…',
  live: 'Live',
  reconnecting: 'Reconnecting…',
  closed: 'Disconnected',
  error: 'Connection error',
}

export function SessionStats({
  socketStatus,
  fps,
  latencyMs,
  framesDropped,
  detections,
}: SessionStatsProps) {
  const rows: Array<[string, string]> = [
    ['Connection', SOCKET_LABEL[socketStatus]],
    ['Throughput', socketStatus === 'live' ? `${fps.toFixed(1)} fps` : '--'],
    ['Server latency', latencyMs != null ? `${latencyMs.toFixed(0)} ms` : '--'],
    ['Frames dropped', String(framesDropped)],
    ['Detections', String(detections)],
  ]

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Session</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-mono text-slate-700 dark:text-slate-300">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
