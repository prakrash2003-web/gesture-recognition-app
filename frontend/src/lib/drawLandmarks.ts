// Draws the 21-point hand skeleton onto a 2D canvas context, layered over the
// video. Landmarks arrive as [x, y] pairs in 0..1 of the frame that was sent to
// the backend; we scale them to the canvas size here.

/** The subset of CanvasRenderingContext2D this module uses (keeps it testable). */
export interface Ctx2D {
  canvas: { width: number; height: number }
  clearRect(x: number, y: number, w: number, h: number): void
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arc(x: number, y: number, r: number, start: number, end: number): void
  stroke(): void
  fill(): void
  lineWidth: number
  strokeStyle: string | CanvasGradient | CanvasPattern
  fillStyle: string | CanvasGradient | CanvasPattern
  lineJoin: CanvasLineJoin
}

export type Landmark = readonly [number, number]

// MediaPipe hand topology: which landmark indices are joined by a bone.
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
]

export interface DrawOptions {
  boneColor?: string
  jointColor?: string
  lineWidth?: number
  jointRadius?: number
}

const DEFAULTS: Required<DrawOptions> = {
  boneColor: 'rgba(129, 140, 248, 0.9)', // brand indigo
  jointColor: '#ffffff',
  lineWidth: 3,
  jointRadius: 4,
}

export function clearCanvas(ctx: Ctx2D): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

export function drawLandmarks(
  ctx: Ctx2D,
  landmarks: ReadonlyArray<Landmark>,
  options: DrawOptions = {},
): void {
  const { boneColor, jointColor, lineWidth, jointRadius } = { ...DEFAULTS, ...options }
  const w = ctx.canvas.width
  const h = ctx.canvas.height

  clearCanvas(ctx)
  if (landmarks.length < 21) return

  const px = (i: number) => [landmarks[i][0] * w, landmarks[i][1] * h] as const

  ctx.lineWidth = lineWidth
  ctx.strokeStyle = boneColor
  ctx.lineJoin = 'round'
  for (const [a, b] of HAND_CONNECTIONS) {
    const [ax, ay] = px(a)
    const [bx, by] = px(b)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }

  ctx.fillStyle = jointColor
  for (let i = 0; i < 21; i++) {
    const [x, y] = px(i)
    ctx.beginPath()
    ctx.arc(x, y, jointRadius, 0, Math.PI * 2)
    ctx.fill()
  }
}
