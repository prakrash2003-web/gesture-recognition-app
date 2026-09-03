import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Gesture } from '../../types'
import { ConfidenceTimelineChart } from './ConfidenceTimelineChart'
import { GestureFrequencyChart } from './GestureFrequencyChart'

// Recharts' ResponsiveContainer needs a real layout box; stub the components our
// charts use down to passthrough divs so we can test the wrapper logic (empty vs.
// populated). Enumerate them explicitly - a Proxy here makes the mocked module
// look thenable and hangs the runner.
vi.mock('recharts', async () => {
  const react = await vi.importActual<typeof import('react')>('react')
  const Pass = (props: { children?: unknown }) =>
    react.createElement('div', null, props.children as never)
  const names = [
    'ResponsiveContainer',
    'BarChart',
    'Bar',
    'AreaChart',
    'Area',
    'XAxis',
    'YAxis',
    'CartesianGrid',
    'Tooltip',
  ]
  return Object.fromEntries(names.map((n) => [n, Pass]))
})

const GESTURES: Gesture[] = [
  { id: 'fist', name: 'Fist', emoji: '✊', description: '' },
  { id: 'victory', name: 'Victory / Peace', emoji: '✌️', description: '' },
]

describe('GestureFrequencyChart', () => {
  it('shows the empty state when no gesture has a count', () => {
    render(<GestureFrequencyChart counts={{}} gestures={GESTURES} />)
    expect(screen.getByText(/no gestures recognized yet/i)).toBeInTheDocument()
  })

  it('renders the chart region when there is data', () => {
    render(<GestureFrequencyChart counts={{ fist: 3 }} gestures={GESTURES} />)
    expect(screen.getByRole('img', { name: /how many times each gesture/i })).toBeInTheDocument()
  })
})

describe('ConfidenceTimelineChart', () => {
  it('asks for more data when the series is too short', () => {
    render(<ConfidenceTimelineChart series={[{ t: 0, confidence: 0.9 }]} />)
    expect(screen.getByText(/not enough data yet/i)).toBeInTheDocument()
  })

  it('renders the chart region with enough points', () => {
    render(
      <ConfidenceTimelineChart
        series={[
          { t: 0, confidence: 0.8 },
          { t: 1, confidence: 0.9 },
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: /confidence over time/i })).toBeInTheDocument()
  })
})
