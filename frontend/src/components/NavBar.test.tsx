import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { NavBar } from './NavBar'

// The badge polls the backend on mount; stub the hook so this test stays offline.
vi.mock('../hooks/useBackendHealth', () => ({
  useBackendHealth: () => ({ status: 'online', version: '0.1.0' }),
}))

describe('NavBar', () => {
  it('renders all the primary navigation links', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    for (const label of ['Live', 'Dashboard', 'Guide', 'About']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})
