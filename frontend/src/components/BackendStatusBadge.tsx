import { useBackendHealth } from '../hooks/useBackendHealth'

// Small pill that shows whether the Python backend is reachable. Colour + label
// come straight from the polling hook.

const STYLES = {
  checking: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  online: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  offline: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
} as const

const LABELS = {
  checking: 'Checking backend',
  online: 'Backend online',
  offline: 'Backend offline',
} as const

export function BackendStatusBadge() {
  const { status, version } = useBackendHealth()

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
      title={version ? `API version ${version}` : undefined}
    >
      <span className="relative flex h-2 w-2">
        {status === 'online' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {LABELS[status]}
    </span>
  )
}
