import { useEffect, useState } from 'react'

import { fetchModelInfo } from '../lib/api'
import type { ModelInfoResponse } from '../types'

// Loads GET /model once for the Model comparison page and the classifier toggle.

interface UseModelInfoResult {
  info: ModelInfoResponse | null
  loading: boolean
  error: string | null
}

export function useModelInfo(): UseModelInfoResult {
  const [info, setInfo] = useState<ModelInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchModelInfo(controller.signal)
      .then((response) => {
        setInfo(response)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load model info')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { info, loading, error }
}
