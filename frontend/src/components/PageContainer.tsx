import type { ReactNode } from 'react'

// Shared page shell: constrains width, adds page padding, and renders a
// consistent title / lead-paragraph block above the page content.

interface PageContainerProps {
  title: string
  lead?: string
  children: ReactNode
}

export function PageContainer({ title, lead, children }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{lead}</p>}
      </header>
      {children}
    </div>
  )
}
