import { useEffect, useId, useRef, useState } from 'react'

import { useSettings } from '../hooks/useSettings'
import { FPS_RANGE, SENSITIVITY_RANGE } from '../lib/settings'
import { RangeField } from './RangeField'
import { Toggle } from './Toggle'

// A disclosure panel toggled by a gear button. Closes on Escape or a click
// outside, and moves focus into the panel when it opens (basic dialog etiquette
// without pulling in a dialog library).

export function SettingsPanel() {
  const { settings, minConfidence, update, reset } = useSettings()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    panelRef.current?.querySelector<HTMLElement>('input,button')?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <GearIcon />
        Settings
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="group"
          aria-label="Recognition settings"
          className="absolute right-0 z-20 mt-2 w-80 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <Toggle
            label="Mirror video"
            description="Flip the camera like a mirror."
            checked={settings.mirror}
            onChange={(v) => update('mirror', v)}
          />
          <Toggle
            label="Show hand skeleton"
            description="Draw the 21 landmark points over the video."
            checked={settings.showOverlay}
            onChange={(v) => update('showOverlay', v)}
          />
          <RangeField
            label="Target frame rate"
            description="Frames sent to the backend per second."
            value={settings.targetFps}
            min={FPS_RANGE.min}
            max={FPS_RANGE.max}
            valueText={`${settings.targetFps} fps`}
            onChange={(v) => update('targetFps', v)}
          />
          <RangeField
            label="Sensitivity"
            description="Higher accepts borderline gestures; lower is stricter."
            value={settings.sensitivity}
            min={SENSITIVITY_RANGE.min}
            max={SENSITIVITY_RANGE.max}
            valueText={`threshold ${minConfidence.toFixed(2)}`}
            onChange={(v) => update('sensitivity', v)}
          />

          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  )
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.22.65.22 1 0 .35-.08.69-.22 1z" />
    </svg>
  )
}
