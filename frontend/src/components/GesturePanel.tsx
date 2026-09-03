import type { FrameResultMessage, Gesture } from '../types'
import { Card } from './Card'

// The headline display: the currently recognized gesture, big, with a confidence
// bar. Distinguishes "no hand in view" from "hand visible but no known gesture".

interface GesturePanelProps {
  result: FrameResultMessage | null
  gestures: Gesture[]
}

export function GesturePanel({ result, gestures }: GesturePanelProps) {
  const match = result?.gesture
    ? gestures.find((g) => g.id === result.gesture)
    : undefined

  let headline: string
  let emoji = '—'
  if (!result || !result.hand_present) {
    headline = 'No hand detected'
  } else if (match) {
    headline = match.name
    emoji = match.emoji
  } else {
    headline = 'Unrecognized gesture'
    emoji = '🖐'
  }

  const confidencePct = Math.round((result?.confidence ?? 0) * 100)

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Detected gesture
      </p>
      <div className="mt-3 flex items-center gap-4">
        <span className="text-5xl leading-none" aria-hidden="true">
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold text-slate-900 dark:text-white">
            {headline}
          </p>
          {match && (
            <p className="text-sm text-slate-500" aria-live="polite">
              {confidencePct}% confidence
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-150"
          style={{ width: `${match ? confidencePct : 0}%` }}
        />
      </div>
    </Card>
  )
}
