import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from '../lib/settings'
import { SettingsProvider, useSettings } from './useSettings'

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
)

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('useSettings', () => {
  it('starts from the defaults', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('updates one field and persists it', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.update('mirror', false))
    expect(result.current.settings.mirror).toBe(false)
    expect(localStorage.getItem('gestureflow-settings')).toContain('"mirror":false')
  })

  it('exposes a derived minConfidence that tracks sensitivity', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    const before = result.current.minConfidence
    act(() => result.current.update('sensitivity', 100))
    expect(result.current.minConfidence).toBeLessThan(before)
  })

  it('reset restores the defaults', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.update('targetFps', 3))
    act(() => result.current.reset())
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('throws outside a provider', () => {
    expect(() => renderHook(() => useSettings())).toThrow(/SettingsProvider/)
  })
})
