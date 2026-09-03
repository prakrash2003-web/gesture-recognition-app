// Thin wrappers around the backend's REST endpoints. Each returns parsed JSON or
// throws an Error with a readable message. Components/hooks handle the loading and
// error states; this file only knows how to make the call.

import { config } from '../config'
import type { GesturesResponse, HealthResponse } from '../types'

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, { signal })
  if (!response.ok) {
    throw new Error(`${path} -> HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

/** GET /health - used by the "backend online" indicator. */
export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return getJson<HealthResponse>('/health', signal)
}

/** GET /gestures - the list the Gesture Guide is built from. */
export function fetchGestures(signal?: AbortSignal): Promise<GesturesResponse> {
  return getJson<GesturesResponse>('/gestures', signal)
}
