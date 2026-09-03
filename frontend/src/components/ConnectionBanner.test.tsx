import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConnectionBanner } from './ConnectionBanner'

const base = { reconnectAttempt: 0, slowConnect: false, onRetry: vi.fn() }

describe('ConnectionBanner', () => {
  it('renders nothing when idle or live', () => {
    const { container: idle } = render(<ConnectionBanner status="idle" {...base} />)
    expect(idle).toBeEmptyDOMElement()
    const { container: live } = render(<ConnectionBanner status="live" {...base} />)
    expect(live).toBeEmptyDOMElement()
  })

  it('shows a plain connecting message, then a cold-start hint', () => {
    const { rerender } = render(<ConnectionBanner status="connecting" {...base} />)
    expect(screen.getByText(/connecting to the backend/i)).toBeInTheDocument()
    rerender(<ConnectionBanner status="connecting" {...base} slowConnect />)
    expect(screen.getByText(/waking up/i)).toBeInTheDocument()
  })

  it('counts reconnection attempts', () => {
    render(<ConnectionBanner status="reconnecting" {...base} reconnectAttempt={3} />)
    expect(screen.getByText(/attempt 3/i)).toBeInTheDocument()
  })

  it('offers a retry button in the error state', async () => {
    const onRetry = vi.fn()
    render(<ConnectionBanner status="error" {...base} onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
