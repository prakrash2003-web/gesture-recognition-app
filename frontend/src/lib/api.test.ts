import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchGestures, fetchHealth } from './api'

// `vi.stubGlobal` swaps in a fake `fetch` so the tests never hit the network.

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
    })),
  )
}

describe('api', () => {
  it('fetchHealth returns the parsed body', async () => {
    mockFetch({ status: 'ok', service: 'gestureflow-backend', version: '0.1.0' })
    const health = await fetchHealth()
    expect(health.status).toBe('ok')
  })

  it('fetchGestures returns the gesture list', async () => {
    mockFetch({ count: 1, gestures: [{ id: 'fist', name: 'Fist', emoji: '', description: '' }] })
    const response = await fetchGestures()
    expect(response.gestures[0].id).toBe('fist')
  })

  it('throws a readable error on a non-2xx response', async () => {
    mockFetch({}, false, 503)
    await expect(fetchHealth()).rejects.toThrow('HTTP 503')
  })
})
