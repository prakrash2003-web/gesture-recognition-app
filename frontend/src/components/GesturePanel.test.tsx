import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { FrameResultMessage, Gesture } from '../types'
import { GesturePanel } from './GesturePanel'

const GESTURES: Gesture[] = [
  { id: 'fist', name: 'Fist', emoji: '✊', description: '' },
  { id: 'victory', name: 'Victory / Peace', emoji: '✌️', description: '' },
]

function result(over: Partial<FrameResultMessage>): FrameResultMessage {
  return {
    type: 'result',
    gesture: null,
    confidence: 0,
    hand_present: true,
    handedness: null,
    landmarks: null,
    scores: {},
    inference_ms: 10,
    frames_dropped: 0,
    ...over,
  }
}

describe('GesturePanel', () => {
  it('shows "No hand detected" before any result', () => {
    render(<GesturePanel result={null} gestures={GESTURES} />)
    expect(screen.getByText('No hand detected')).toBeInTheDocument()
  })

  it('shows "No hand detected" when a result has no hand', () => {
    render(<GesturePanel result={result({ hand_present: false })} gestures={GESTURES} />)
    expect(screen.getByText('No hand detected')).toBeInTheDocument()
  })

  it('shows the gesture name and confidence when recognized', () => {
    render(
      <GesturePanel
        result={result({ gesture: 'fist', confidence: 0.82 })}
        gestures={GESTURES}
      />,
    )
    expect(screen.getByText('Fist')).toBeInTheDocument()
    expect(screen.getByText('82% confidence')).toBeInTheDocument()
  })

  it('shows "Unrecognized gesture" when a hand is present but no gesture id matches', () => {
    render(<GesturePanel result={result({ gesture: null })} gestures={GESTURES} />)
    expect(screen.getByText('Unrecognized gesture')).toBeInTheDocument()
  })
})
