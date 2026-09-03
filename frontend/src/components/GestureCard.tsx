import type { Gesture } from '../types'
import { Card } from './Card'

// Displays one gesture: big emoji, name, and how to perform it. Used on the Guide
// page now, and reused on the Live page in Phase 5 to highlight the current match.

interface GestureCardProps {
  gesture: Gesture
  active?: boolean
}

export function GestureCard({ gesture, active = false }: GestureCardProps) {
  return (
    <Card
      className={`transition-colors ${
        active ? 'border-brand-500 ring-1 ring-brand-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {gesture.emoji}
        </span>
        <div>
          <h3 className="font-medium text-slate-900 dark:text-white">{gesture.name}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {gesture.description}
          </p>
          <p className="mt-2 font-mono text-xs text-slate-400">{gesture.id}</p>
        </div>
      </div>
    </Card>
  )
}
