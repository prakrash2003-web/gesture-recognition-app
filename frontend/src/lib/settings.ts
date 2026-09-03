// Pure settings model: defaults, bounds, and the derived values other code needs.
// The React wiring lives in hooks/useSettings.tsx; keeping the maths here makes it
// easy to test.

export interface Settings {
  /** Mirror the video (natural for a front camera). Display-only. */
  mirror: boolean
  /** Draw the 21-point hand skeleton over the video. */
  showOverlay: boolean
  /** Frames per second to send to the backend. */
  targetFps: number
  /** 0 = only very clear gestures, 100 = accept borderline ones. */
  sensitivity: number
}

export const DEFAULT_SETTINGS: Settings = {
  mirror: true,
  showOverlay: true,
  targetFps: 10,
  sensitivity: 50,
}

export const FPS_RANGE = { min: 3, max: 15 } as const
export const SENSITIVITY_RANGE = { min: 0, max: 100 } as const

// The classifier threshold the backend understands (see backend
// classifier_rules.MIN_CONFIDENCE_RANGE). Higher sensitivity -> lower threshold.
const CONFIDENCE_AT_MIN_SENSITIVITY = 0.95
const CONFIDENCE_AT_MAX_SENSITIVITY = 0.4

export function sensitivityToMinConfidence(sensitivity: number): number {
  const t = clamp(sensitivity, SENSITIVITY_RANGE.min, SENSITIVITY_RANGE.max) / 100
  const value =
    CONFIDENCE_AT_MIN_SENSITIVITY -
    t * (CONFIDENCE_AT_MIN_SENSITIVITY - CONFIDENCE_AT_MAX_SENSITIVITY)
  return Math.round(value * 100) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Coerce an unknown (e.g. from localStorage) into a valid Settings object. */
export function normalizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS }
  const r = raw as Record<string, unknown>
  return {
    mirror: typeof r.mirror === 'boolean' ? r.mirror : DEFAULT_SETTINGS.mirror,
    showOverlay:
      typeof r.showOverlay === 'boolean' ? r.showOverlay : DEFAULT_SETTINGS.showOverlay,
    targetFps:
      typeof r.targetFps === 'number'
        ? Math.round(clamp(r.targetFps, FPS_RANGE.min, FPS_RANGE.max))
        : DEFAULT_SETTINGS.targetFps,
    sensitivity:
      typeof r.sensitivity === 'number'
        ? Math.round(clamp(r.sensitivity, SENSITIVITY_RANGE.min, SENSITIVITY_RANGE.max))
        : DEFAULT_SETTINGS.sensitivity,
  }
}
