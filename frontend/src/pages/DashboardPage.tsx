import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '../components/Card'
import { GestureHistoryTimeline } from '../components/GestureHistoryTimeline'
import { PageContainer } from '../components/PageContainer'
import { ConfidenceTimelineChart } from '../components/charts/ConfidenceTimelineChart'
import { GestureFrequencyChart } from '../components/charts/GestureFrequencyChart'
import { useGestures } from '../hooks/useGestures'
import { useSessionRecorder } from '../hooks/useSessionRecorder'
import {
  confidenceSeries,
  frequencyByGesture,
  summarize,
  toSegments,
} from '../lib/session'

// Reads the session recorded on the Live page and visualizes it. Everything is
// derived with useMemo from the same sample array.
export function DashboardPage() {
  const { gestures } = useGestures()
  const { samples } = useSessionRecorder()

  const { summary, counts, series, segments } = useMemo(
    () => ({
      summary: summarize(samples),
      counts: frequencyByGesture(samples),
      series: confidenceSeries(samples),
      segments: toSegments(samples),
    }),
    [samples],
  )

  const hasData = samples.length > 0
  const tiles = [
    ['Gestures recognized', String(summary.detections)],
    ['Distinct gestures', String(summary.distinctGestures)],
    ['Avg. confidence', hasData ? `${Math.round(summary.avgConfidence * 100)}%` : '--'],
    ['Session length', hasData ? `${Math.round(summary.durationMs / 1000)}s` : '--'],
  ] as const

  return (
    <PageContainer
      title="Dashboard"
      lead="Statistics from your recognition session - how often each gesture appeared, how confident the classifier was, and what happened when."
    >
      {!hasData && (
        <Card className="mb-6 border-brand-200 dark:border-brand-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No session data yet.{' '}
            <Link to="/" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Start a session on the Live page
            </Link>{' '}
            and this dashboard fills in.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GestureFrequencyChart counts={counts} gestures={gestures} />
        <ConfidenceTimelineChart series={series} />
      </div>

      <div className="mt-6">
        <GestureHistoryTimeline segments={segments} gestures={gestures} />
      </div>
    </PageContainer>
  )
}
