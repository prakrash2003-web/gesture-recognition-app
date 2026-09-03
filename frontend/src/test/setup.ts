// Loaded once before any test (see vite.config.ts -> test.setupFiles).
// Adds DOM-specific matchers like `toBeInTheDocument()` and cleans up the
// rendered React tree after every test.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom has no canvas rendering. Our drawing code already handles a null context
// (the real rendering is covered by drawLandmarks.test.ts with a fake context);
// stub getContext to return null quietly instead of jsdom's "Not implemented" noise.
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

