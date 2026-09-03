import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { GestureSegment } from '../lib/session'
import type { Gesture } from '../types'
import { GestureHistoryTimeline } from './GestureHistoryTimeline'

const GESTURES: Gesture[] = [
  { id: 'fist', name: 'Fist', emoji: '✊', description: '' },
  { id: 'victory', name: 'Victory / Peace', emoji: '✌️', description: '' },
]

describe('GestureHistoryTimeline', () => {
  it('shows an empty message with no segments', () => {
    render(<GestureHistoryTimeline segments={[]} gestures={GESTURES} />)
    expect(screen.getByText(/will appear here/i)).toBeInTheDocument()
  })

  it('lists segments most-recent first, capped at the limit', () => {
    const segments: GestureSegment[] = [
      { gesture: 'fist', start: 0, end: 1000 },
      { gesture: 'victory', start: 2000, end: 2500 },
      { gesture: 'fist', start: 4000, end: 4200 },
    ]
    render(<GestureHistoryTimeline segments={segments} gestures={GESTURES} limit={2} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Fist') // the last segment
    expect(items[1]).toHaveTextContent('Victory / Peace')
  })
})
