import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { SettingsProvider } from '../hooks/useSettings'
import { renderWithProviders } from '../test/renderWithProviders'
import { SettingsPanel } from './SettingsPanel'

afterEach(() => localStorage.clear())

const panel = () => (
  <SettingsProvider>
    <SettingsPanel />
  </SettingsProvider>
)

describe('SettingsPanel', () => {
  it('is collapsed until the button is pressed', () => {
    renderWithProviders(panel())
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('switch', { name: 'Mirror video' })).not.toBeInTheDocument()
  })

  it('opens and toggles a setting', async () => {
    renderWithProviders(panel())
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    const mirror = screen.getByRole('switch', { name: 'Mirror video' })
    expect(mirror).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(mirror)
    expect(screen.getByRole('switch', { name: 'Mirror video' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('closes on Escape', async () => {
    renderWithProviders(panel())
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('switch', { name: 'Mirror video' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('switch', { name: 'Mirror video' })).not.toBeInTheDocument()
  })
})
