// Central place to read environment configuration.
//
// `import.meta.env` is how Vite exposes environment variables to browser code.
// Only names starting with VITE_ are included (so we can't accidentally leak a
// server secret). Values come from `.env` in dev and from the hosting platform's
// dashboard in production.

const DEFAULT_API = 'http://127.0.0.1:8000'
const DEFAULT_WS = 'ws://127.0.0.1:8000/ws'

const apiFromEnv = import.meta.env.VITE_API_BASE_URL
const wsFromEnv = import.meta.env.VITE_WS_URL

// A production build that reached the browser without the backend URLs set will
// silently try to talk to localhost. Make that loud in the console.
if (import.meta.env.PROD && (!apiFromEnv || !wsFromEnv)) {
  console.error(
    'GestureFlow: VITE_API_BASE_URL / VITE_WS_URL are not set for this build. ' +
      'The app will try to reach a local backend and fail. Set them in the ' +
      'hosting provider and redeploy.',
  )
}

export const config = {
  /** Base URL of the FastAPI backend, no trailing slash. */
  apiBaseUrl: (apiFromEnv ?? DEFAULT_API).replace(/\/$/, ''),
  /** Full URL of the gesture WebSocket. */
  wsUrl: wsFromEnv ?? DEFAULT_WS,
} as const
