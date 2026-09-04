import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ConfusionMatrix } from './ConfusionMatrix'

describe('ConfusionMatrix', () => {
  const matrix = [
    [8, 2],
    [1, 9],
  ]
  const labels = ['fist', 'open_palm']
  const names = { fist: 'Fist', open_palm: 'Open Palm' }

  it('renders a cell for every matrix entry', () => {
    render(<ConfusionMatrix matrix={matrix} labels={labels} gestureNames={names} />)
    for (const value of ['8', '2', '1', '9']) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('uses the human gesture names in the headers', () => {
    render(<ConfusionMatrix matrix={matrix} labels={labels} gestureNames={names} />)
    expect(screen.getAllByText('Fist').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Open Palm').length).toBeGreaterThan(0)
  })

  it('falls back to the raw id when no name is known', () => {
    render(<ConfusionMatrix matrix={[[1]]} labels={['mystery']} gestureNames={{}} />)
    expect(screen.getAllByText('mystery').length).toBeGreaterThan(0)
  })
})
