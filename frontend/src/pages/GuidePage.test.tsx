import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Gesture } from '../types'
import { GuidePage } from './GuidePage'

// Replace the data hook so the page renders synchronously with known data.
const mockUseGestures = vi.fn()
vi.mock('../hooks/useGestures', () => ({
  useGestures: () => mockUseGestures(),
}))

const SAMPLE: Gesture[] = [
  { id: 'fist', name: 'Fist', emoji: '', description: 'All fingers curled.' },
  { id: 'open_palm', name: 'Open Palm', emoji: '', description: 'All fingers extended.' },
]

afterEach(() => vi.clearAllMocks())

describe('GuidePage', () => {
  it('shows a loading message while fetching', () => {
    mockUseGestures.mockReturnValue({ gestures: [], loading: true, error: null })
    render(<GuidePage />)
    expect(screen.getByText(/loading gestures/i)).toBeInTheDocument()
  })

  it('renders one card per gesture', () => {
    mockUseGestures.mockReturnValue({ gestures: SAMPLE, loading: false, error: null })
    render(<GuidePage />)
    expect(screen.getByText('Fist')).toBeInTheDocument()
    expect(screen.getByText('Open Palm')).toBeInTheDocument()
  })

  it('shows an error state when the fetch fails', () => {
    mockUseGestures.mockReturnValue({
      gestures: [],
      loading: false,
      error: '/gestures -> HTTP 500',
    })
    render(<GuidePage />)
    expect(screen.getByText(/couldn't load gestures/i)).toBeInTheDocument()
  })
})
