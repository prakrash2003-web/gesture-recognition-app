// Pure functions that turn a stream of per-frame samples into the numbers and
// series the Dashboard charts need. No React here - all tested directly.

export interface GestureSample {
  /** ms timestamp (performance.now()). */
  at: number
  gesture: string | null
  confidence: number
}

export interface GestureSegment {
  gesture: string
  start: number
  end: number
}

/**
 * Collapse a stream of samples into gesture "runs". A run ends when the gesture
 * changes OR the hand leaves the frame (a null sample), so holding a gesture,
 * dropping the hand, then repeating it counts as two runs.
 */
export function toSegments(samples: GestureSample[]): GestureSegment[] {
  const segments: GestureSegment[] = []
  let open: GestureSegment | null = null

  for (const sample of samples) {
    if (sample.gesture === null) {
      open = null
      continue
    }
    if (open && open.gesture === sample.gesture) {
      open.end = sample.at
    } else {
      open = { gesture: sample.gesture, start: sample.at, end: sample.at }
      segments.push(open)
    }
  }
  return segments
}

/** How many times each gesture was performed (one count per segment). */
export function frequencyByGesture(samples: GestureSample[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const segment of toSegments(samples)) {
    counts[segment.gesture] = (counts[segment.gesture] ?? 0) + 1
  }
  return counts
}

export interface ConfidencePoint {
  /** seconds since the session started */
  t: number
  confidence: number
}

/**
 * Average confidence in fixed time buckets, so the line chart stays readable no
 * matter how many frames arrived. Only samples with a recognized gesture count.
 */
export function confidenceSeries(
  samples: GestureSample[],
  bucketMs = 1000,
): ConfidencePoint[] {
  if (samples.length === 0) return []
  const t0 = samples[0].at
  const buckets = new Map<number, { sum: number; n: number }>()

  for (const sample of samples) {
    if (sample.gesture === null) continue
    const bucket = Math.floor((sample.at - t0) / bucketMs)
    const entry = buckets.get(bucket) ?? { sum: 0, n: 0 }
    entry.sum += sample.confidence
    entry.n += 1
    buckets.set(bucket, entry)
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, { sum, n }]) => ({
      t: Math.round((bucket * bucketMs) / 1000),
      confidence: Math.round((sum / n) * 100) / 100,
    }))
}

export interface SessionSummary {
  detections: number
  distinctGestures: number
  avgConfidence: number
  durationMs: number
}

export function summarize(samples: GestureSample[]): SessionSummary {
  const segments = toSegments(samples)
  const recognized = samples.filter((s) => s.gesture !== null)
  const avg =
    recognized.length > 0
      ? recognized.reduce((sum, s) => sum + s.confidence, 0) / recognized.length
      : 0
  return {
    detections: segments.length,
    distinctGestures: new Set(segments.map((s) => s.gesture)).size,
    avgConfidence: Math.round(avg * 100) / 100,
    durationMs: samples.length > 0 ? samples.at(-1)!.at - samples[0].at : 0,
  }
}
