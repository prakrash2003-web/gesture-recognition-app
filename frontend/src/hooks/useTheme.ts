import { useCallback, useEffect, useState } from 'react'

// A "hook" is a function whose name starts with `use` that lets a component tap
// into React features (here: state + side effects). This one owns the light/dark
// choice: it reads a saved preference (or the OS setting), applies it by toggling
// the `.dark` class on <html>, and persists any change.

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'gestureflow-theme'

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage can throw in private-browsing / blocked-cookies modes.
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Ignore persistence failures - the toggle still works for this session.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
