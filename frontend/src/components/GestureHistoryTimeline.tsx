import type { GestureSegment } from '../lib/session'
import type { Gesture } from '../types'
import { Card } from './Card'

interface GestureHistoryTimelineProps {
  segments: GestureSegment[]
  gestures: Gesture[]
  /** Show at most this many, most recent first. */
  limit?: number
}

// A reverse-chronological list of gesture "runs" - each entry is one continuous
// stretch where the same gesture was held.
export function GestureHistoryTimeline({
  segments,
  gestures,
  limit = 12,
}: GestureHistoryTimelineProps) {
  const byId = new Map(gestures.map((g) => [g.id, g]))
  const recent = [...segments].reverse().slice(0, limit)
  const sessionStart = segments[0]?.start ?? 0

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Gesture history</h3>
      {recent.length === 0 ? (
        <p className="mt-6 mb-6 text-center text-sm text-slate-400">
          Recognized gestures will appear here.
        </p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {recent.map((segment, i) => {
            const g = byId.get(segment.gesture)
            const held = Math.max(0, Math.round((segment.end - segment.start) / 100) / 10)
            const offset = Math.max(0, Math.round((segment.start - sessionStart) / 1000))
            return (
              <li
                key={`${segment.start}-${i}`}
                className="flex items-center gap-3 text-sm"
              >
                <span className="w-10 font-mono text-xs text-slate-400">{offset}s</span>
                <span aria-hidden="true">{g?.emoji ?? '•'}</span>
                <span className="flex-1 text-slate-700 dark:text-slate-300">
                  {g?.name ?? segment.gesture}
                </span>
                <span className="font-mono text-xs text-slate-400">{held}s</span>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
