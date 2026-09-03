import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { GestureSample } from '../lib/session'
import type { FrameResultMessage } from '../types'

// Records the current recognition session so the Dashboard can chart it after the
// user navigates away from the Live page. A Context because the Live page writes
// and the Dashboard reads.
//
// Samples are capped so a long session can't grow memory without bound.

const MAX_SAMPLES = 3000 // ~5 min at 10 fps

interface SessionRecorderValue {
  samples: GestureSample[]
  record: (result: FrameResultMessage) => void
  clear: () => void
}

const SessionRecorderContext = createContext<SessionRecorderValue | null>(null)

export function SessionRecorderProvider({ children }: { children: ReactNode }) {
  const [samples, setSamples] = useState<GestureSample[]>([])
  const lastAtRef = useRef(Number.NEGATIVE_INFINITY)

  const record = useCallback((result: FrameResultMessage) => {
    const now = performance.now()
    // Throttle storage to ~5/s; the raw stream is finer than any chart needs.
    if (now - lastAtRef.current < 180) return
    lastAtRef.current = now

    setSamples((prev) => {
      const next = prev.length >= MAX_SAMPLES ? prev.slice(1) : prev.slice()
      next.push({
        at: now,
        gesture: result.hand_present ? result.gesture : null,
        confidence: result.confidence,
      })
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSamples([])
    lastAtRef.current = Number.NEGATIVE_INFINITY
  }, [])

  const value = useMemo<SessionRecorderValue>(
    () => ({ samples, record, clear }),
    [samples, record, clear],
  )

  return <SessionRecorderContext value={value}>{children}</SessionRecorderContext>
}

// Provider + hook colocated (the standard React Context pattern).
// oxlint-disable-next-line react/only-export-components
export function useSessionRecorder(): SessionRecorderValue {
  const ctx = useContext(SessionRecorderContext)
  if (!ctx) throw new Error('useSessionRecorder must be used within <SessionRecorderProvider>')
  return ctx
}
