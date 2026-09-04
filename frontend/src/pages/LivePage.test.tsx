import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../test/renderWithProviders'
import { LivePage } from './LivePage'

// The page is pure wiring; mock the webcam/socket hooks so the test drives the
// wiring, not their internals (those have their own tests).

const start = vi.fn()
const stop = vi.fn()
const sendReset = vi.fn()

const webcam = { status: 'idle', stream: null, errorDetail: null, start, stop }
const socket = {
  status: 'idle',
  ready: null,
  lastResult: null,
  lastError: null,
  reconnectAttempt: 0,
  sendReset,
}

vi.mock('../hooks/useWebcam', () => ({ useWebcam: () => webcam }))
vi.mock('../hooks/useGestureSocket', () => ({ useGestureSocket: () => socket }))
vi.mock('../hooks/useGestures', () => ({
  useGestures: () => ({ gestures: [], loading: false, error: null }),
}))
vi.mock('../hooks/useModelInfo', () => ({
  useModelInfo: () => ({ info: { ml_available: false, report: null }, loading: false, error: null }),
}))

afterEach(() => {
  vi.clearAllMocks()
  webcam.status = 'idle'
})

describe('LivePage', () => {
  it('renders the start control and the idle camera message', () => {
    renderWithProviders(<LivePage />)
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    expect(screen.getByText('Camera off')).toBeInTheDocument()
  })

  it('starts the webcam when Start is pressed', async () => {
    renderWithProviders(<LivePage />)
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(start).toHaveBeenCalledOnce()
  })

  it('offers a settings panel', async () => {
    renderWithProviders(<LivePage />)
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('switch', { name: 'Mirror video' })).toBeInTheDocument()
  })

  it('disables Reset until the camera is active', () => {
    renderWithProviders(<LivePage />)
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
  })

  it('shows a retry-camera link after a denied permission', () => {
    webcam.status = 'denied'
    renderWithProviders(<LivePage />)
    expect(screen.getByRole('button', { name: /retry camera access/i })).toBeInTheDocument()
  })
})
