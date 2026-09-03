import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Toggle } from './Toggle'

describe('Toggle', () => {
  it('exposes an accessible switch reflecting the checked state', () => {
    render(<Toggle label="Mirror video" checked onChange={vi.fn()} />)
    const sw = screen.getByRole('switch', { name: 'Mirror video' })
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with the toggled value', async () => {
    const onChange = vi.fn()
    render(<Toggle label="Mirror video" checked={false} onChange={onChange} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
