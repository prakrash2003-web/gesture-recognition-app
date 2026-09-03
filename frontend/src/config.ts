// Central place to read environment configuration.
//
// `import.meta.env` is how Vite exposes environment variables to browser code.
// Only names starting with VITE_ are included (so we can't accidentally leak a
// server secret). Values come from `.env` in dev and from the hosting platform's
// dashboard in production.

const DEFAULT_API = 'http://127.0.0.1:8000'
const DEFAULT_WS = 'ws://127.0.0.1:8000/ws'

export const config = {
  /** Base URL of the FastAPI backend, no trailing slash. */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API).replace(/\/$/, ''),
  /** Full URL of the gesture WebSocket. */
  wsUrl: import.meta.env.VITE_WS_URL ?? DEFAULT_WS,
} as const
