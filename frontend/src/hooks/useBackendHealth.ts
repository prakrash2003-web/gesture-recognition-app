import { useEffect, useState } from 'react'

import { fetchHealth } from '../lib/api'

// Polls GET /health so the UI can show whether the Python backend is reachable.
// On a free hosting tier the backend may be asleep and take a few seconds to wake,
// so "checking" is a distinct state from "offline".

export type BackendStatus = 'checking' | 'online' | 'offline'

export function useBackendHealth(intervalMs = 15_000) {
  const [status, setStatus] = useState<BackendStatus>('checking')
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function check() {
      try {
        const health = await fetchHealth(controller.signal)
        if (!cancelled) {
          setStatus('online')
          setVersion(health.version)
        }
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }

    check()
    const timer = setInterval(check, intervalMs)
    return () => {
      cancelled = true
      controller.abort()
      clearInterval(timer)
    }
  }, [intervalMs])

  return { status, version }
}
