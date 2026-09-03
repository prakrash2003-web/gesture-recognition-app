import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useTheme } from './useTheme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  localStorage.clear()
})

describe('useTheme', () => {
  it('toggles between light and dark', () => {
    const { result } = renderHook(() => useTheme())
    const start = result.current.theme

    act(() => result.current.toggleTheme())
    expect(result.current.theme).not.toBe(start)
  })

  it('adds the `dark` class to <html> when dark', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      if (result.current.theme === 'light') result.current.toggleTheme()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('persists the choice to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(localStorage.getItem('gestureflow-theme')).toBe(result.current.theme)
  })
})
