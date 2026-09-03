import { describe, expect, it } from 'vitest'

import {
  confidenceSeries,
  frequencyByGesture,
  summarize,
  toSegments,
  type GestureSample,
} from './session'

const s = (at: number, gesture: string | null, confidence = 0.9): GestureSample => ({
  at,
  gesture,
  confidence,
})

describe('toSegments', () => {
  it('collapses consecutive same-gesture samples into one segment', () => {
    const segments = toSegments([s(0, 'fist'), s(100, 'fist'), s(200, 'fist')])
    expect(segments).toEqual([{ gesture: 'fist', start: 0, end: 200 }])
  })

  it('starts a new segment when the gesture changes', () => {
    const segments = toSegments([s(0, 'fist'), s(100, 'victory'), s(200, 'fist')])
    expect(segments.map((seg) => seg.gesture)).toEqual(['fist', 'victory', 'fist'])
  })

  it('ignores null (no-gesture) samples', () => {
    const segments = toSegments([s(0, 'fist'), s(100, null), s(200, 'fist')])
    expect(segments).toHaveLength(2)
  })
})

describe('frequencyByGesture', () => {
  it('counts one per segment, not per frame', () => {
    const counts = frequencyByGesture([
      s(0, 'fist'),
      s(100, 'fist'),
      s(200, 'victory'),
      s(300, 'fist'),
    ])
    expect(counts).toEqual({ fist: 2, victory: 1 })
  })
})

describe('confidenceSeries', () => {
  it('averages confidence into time buckets', () => {
    const series = confidenceSeries(
      [s(0, 'fist', 0.8), s(400, 'fist', 1.0), s(1200, 'fist', 0.6)],
      1000,
    )
    expect(series).toEqual([
      { t: 0, confidence: 0.9 },
      { t: 1, confidence: 0.6 },
    ])
  })

  it('is empty with no samples', () => {
    expect(confidenceSeries([])).toEqual([])
  })
})

describe('summarize', () => {
  it('reports detections, distinct gestures, average confidence and duration', () => {
    const summary = summarize([
      s(0, 'fist', 0.8),
      s(1000, 'victory', 1.0),
      s(2000, null),
      s(3000, 'fist', 0.6),
    ])
    expect(summary.detections).toBe(3)
    expect(summary.distinctGestures).toBe(2)
    expect(summary.avgConfidence).toBe(0.8)
    expect(summary.durationMs).toBe(3000)
  })
})
