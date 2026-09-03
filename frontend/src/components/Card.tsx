import type { ReactNode } from 'react'

// A plain presentational component: it just wraps its children in a consistently
// styled panel. `className` lets callers add layout tweaks without duplicating
// the base styles.

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  )
}
