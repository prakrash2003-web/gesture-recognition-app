// Loaded once before any test (see vite.config.ts -> test.setupFiles).
// Adds DOM-specific matchers like `toBeInTheDocument()` and cleans up the
// rendered React tree after every test.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
