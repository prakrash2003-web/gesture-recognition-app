/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vite config. Two plugins:
//  - react()       enables JSX + Fast Refresh (instant updates while editing)
//  - tailwindcss() compiles the Tailwind utility classes used in the components
//
// The `test` block configures Vitest (our test runner) to run components in a
// simulated browser (jsdom) with the jest-dom matchers loaded.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
