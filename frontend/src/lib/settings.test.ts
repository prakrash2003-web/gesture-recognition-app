import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SETTINGS,
  FPS_RANGE,
  normalizeSettings,
  sensitivityToMinConfidence,
} from './settings'

describe('sensitivityToMinConfidence', () => {
  it('maps low sensitivity to a strict (high) threshold', () => {
    expect(sensitivityToMinConfidence(0)).toBeGreaterThan(0.9)
  })

  it('maps high sensitivity to a loose (low) threshold', () => {
    expect(sensitivityToMinConfidence(100)).toBeLessThan(0.5)
  })

  it('is monotonically decreasing', () => {
    expect(sensitivityToMinConfidence(20)).toBeGreaterThan(sensitivityToMinConfidence(80))
  })

  it('clamps out-of-range input', () => {
    expect(sensitivityToMinConfidence(-50)).toBe(sensitivityToMinConfidence(0))
    expect(sensitivityToMinConfidence(999)).toBe(sensitivityToMinConfidence(100))
  })
})

describe('normalizeSettings', () => {
  it('returns defaults for junk input', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('nope')).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings(42)).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid fields and repairs invalid ones', () => {
    const result = normalizeSettings({ mirror: false, targetFps: 999, sensitivity: 'x' })
    expect(result.mirror).toBe(false)
    expect(result.targetFps).toBe(FPS_RANGE.max)
    expect(result.sensitivity).toBe(DEFAULT_SETTINGS.sensitivity)
  })

  it('accepts a valid classifier and rejects anything else', () => {
    expect(normalizeSettings({ classifier: 'ml' }).classifier).toBe('ml')
    expect(normalizeSettings({ classifier: 'wat' }).classifier).toBe(
      DEFAULT_SETTINGS.classifier,
    )
  })
})
