import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  sensitivityToMinConfidence,
  type Settings,
} from '../lib/settings'

// App-wide user settings, persisted to localStorage. A React Context so any
// component (the Live page, the settings panel) reads and updates the same state.

const STORAGE_KEY = 'gestureflow-settings'

interface SettingsContextValue {
  settings: Settings
  /** Derived: the classifier threshold to send to the backend. */
  minConfidence: number
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeSettings(JSON.parse(raw))
  } catch {
    // ignore malformed / unavailable storage
  }
  return { ...DEFAULT_SETTINGS }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore persistence failures
    }
  }, [settings])

  const update = useCallback<SettingsContextValue['update']>((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      minConfidence: sensitivityToMinConfidence(settings.sensitivity),
      update,
      reset,
    }),
    [settings, update, reset],
  )

  return <SettingsContext value={value}>{children}</SettingsContext>
}

// Provider + hook colocated (the standard React Context pattern). The Fast Refresh
// lint rule only wants components in a file; the trade-off isn't worth an extra file.
// oxlint-disable-next-line react/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within <SettingsProvider>')
  return ctx
}
