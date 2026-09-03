import type { SocketStatus } from '../hooks/useGestureSocket'

interface ConnectionBannerProps {
  status: SocketStatus
  reconnectAttempt: number
  /** True once the "connecting" state has lasted long enough to suspect a cold start. */
  slowConnect: boolean
  onRetry: () => void
}

// A single-line status strip shown above the camera while the socket is not
// healthy. Hidden entirely when idle or live.
export function ConnectionBanner({
  status,
  reconnectAttempt,
  slowConnect,
  onRetry,
}: ConnectionBannerProps) {
  if (status === 'idle' || status === 'live' || status === 'closed') return null

  const tone =
    status === 'error'
      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
      : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'

  let text: string
  if (status === 'connecting') {
    text = slowConnect
      ? 'Connecting to the backend… the free server may be waking up (up to ~30s).'
      : 'Connecting to the backend…'
  } else if (status === 'reconnecting') {
    text = `Connection lost. Reconnecting${reconnectAttempt > 1 ? ` (attempt ${reconnectAttempt})` : ''}…`
  } else {
    text = 'Could not connect to the backend.'
  }

  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${tone}`}
    >
      <span>{text}</span>
      {status === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-xs font-medium text-rose-800 hover:bg-white dark:bg-white/10 dark:text-rose-200"
        >
          Retry
        </button>
      )}
    </div>
  )
}
