import { useEffect, useState } from 'react'

import { fetchGestures } from '../lib/api'
import type { Gesture } from '../types'

// Loads the gesture list from GET /gestures once and exposes the three states any
// data fetch has: loading, error, or data. The Guide page renders it; the Live
// page (Phase 5) reuses it.

interface UseGesturesResult {
  gestures: Gesture[]
  loading: boolean
  error: string | null
}

export function useGestures(): UseGesturesResult {
  const [gestures, setGestures] = useState<Gesture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchGestures(controller.signal)
      .then((response) => {
        setGestures(response.gestures)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load gestures')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { gestures, loading, error }
}
