import type { ReactNode } from 'react'

import { Card } from '../Card'

interface ChartFrameProps {
  title: string
  empty: boolean
  emptyLabel: string
  ariaLabel: string
  children: ReactNode
}

// Shared wrapper for the dashboard charts: a titled card that shows an empty
// message until there is data, and labels the chart region for screen readers
// (the SVG itself is decorative to them).
export function ChartFrame({ title, empty, emptyLabel, ariaLabel, children }: ChartFrameProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {empty ? (
        <p className="mt-6 mb-6 text-center text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <div className="mt-3 text-slate-500" role="img" aria-label={ariaLabel}>
          {children}
        </div>
      )}
    </Card>
  )
}
