import { describe, expect, it, vi } from 'vitest'

import { clearCanvas, drawLandmarks, HAND_CONNECTIONS, type Ctx2D } from './drawLandmarks'

function fakeCtx(width = 200, height = 100) {
  return {
    canvas: { width, height },
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    lineWidth: 0,
    strokeStyle: '',
    fillStyle: '',
    lineJoin: 'miter' as CanvasLineJoin,
  } satisfies Ctx2D & Record<string, unknown>
}

const HAND = Array.from({ length: 21 }, (_, i) => [i / 21, i / 21] as const)

describe('drawLandmarks', () => {
  it('clears the canvas before drawing', () => {
    const ctx = fakeCtx()
    drawLandmarks(ctx, HAND)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100)
  })

  it('draws one stroke per bone and one arc per joint', () => {
    const ctx = fakeCtx()
    drawLandmarks(ctx, HAND)
    expect(ctx.stroke).toHaveBeenCalledTimes(HAND_CONNECTIONS.length)
    expect(ctx.arc).toHaveBeenCalledTimes(21)
  })

  it('scales normalized coordinates to canvas pixels', () => {
    const ctx = fakeCtx(200, 100)
    drawLandmarks(ctx, HAND)
    // landmark 0 is at (0, 0); the first bone starts there.
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0)
  })

  it('does nothing but clear when fewer than 21 points are given', () => {
    const ctx = fakeCtx()
    drawLandmarks(ctx, HAND.slice(0, 10))
    expect(ctx.clearRect).toHaveBeenCalledOnce()
    expect(ctx.stroke).not.toHaveBeenCalled()
  })
})

describe('clearCanvas', () => {
  it('clears the whole canvas', () => {
    const ctx = fakeCtx(50, 60)
    clearCanvas(ctx)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 50, 60)
  })
})
