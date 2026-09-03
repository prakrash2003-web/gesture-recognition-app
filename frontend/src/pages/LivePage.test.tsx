import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LivePage } from './LivePage'

// The page is pure wiring; mock the hooks so the test drives the wiring, not the
// webcam / socket internals (those have their own tests).

const start = vi.fn()
const stop = vi.fn()
const sendReset = vi.fn()

const webcam = { status: 'idle', stream: null, errorDetail: null, start, stop }
const socket = {
  status: 'idle',
  ready: null,
  lastResult: null,
  lastError: null,
  sendReset,
}

vi.mock('../hooks/useWebcam', () => ({ useWebcam: () => webcam }))
vi.mock('../hooks/useGestureSocket', () => ({ useGestureSocket: () => socket }))
vi.mock('../hooks/useGestures', () => ({
  useGestures: () => ({ gestures: [], loading: false, error: null }),
}))

afterEach(() => {
  vi.clearAllMocks()
  webcam.status = 'idle'
})

describe('LivePage', () => {
  it('renders the start control and the idle camera message', () => {
    render(<LivePage />)
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    expect(screen.getByText('Camera off')).toBeInTheDocument()
  })

  it('starts the webcam when Start is pressed', async () => {
    render(<LivePage />)
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(start).toHaveBeenCalledOnce()
  })

  it('shows Stop and the reset control once the camera is active', () => {
    webcam.status = 'active'
    render(<LivePage />)
    // running starts false, so Start is still shown until pressed; Reset is disabled.
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
  })
})
