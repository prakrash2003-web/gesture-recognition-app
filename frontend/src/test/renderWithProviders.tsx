import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { SessionRecorderProvider } from '../hooks/useSessionRecorder'
import { SettingsProvider } from '../hooks/useSettings'

// Test helper: render a component inside the same providers main.tsx wires up
// (router, settings, session recorder).
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <SettingsProvider>
        <SessionRecorderProvider>{children}</SessionRecorderProvider>
      </SettingsProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options })
}
