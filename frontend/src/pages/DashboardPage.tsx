import { Card } from '../components/Card'
import { PageContainer } from '../components/PageContainer'

// Phase 6 fills this with real charts (gesture frequency, confidence over time,
// FPS/latency) fed by the live session. For now it establishes the layout.

const PLACEHOLDER_TILES = [
  { label: 'Gestures recognized', value: '--' },
  { label: 'Avg. confidence', value: '--' },
  { label: 'Avg. latency', value: '--' },
  { label: 'Session length', value: '--' },
]

export function DashboardPage() {
  return (
    <PageContainer
      title="Dashboard"
      lead="Statistics from your recognition session - how often each gesture appeared, how confident the classifier was, and how fast the pipeline ran."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_TILES.map((tile) => (
          <Card key={tile.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {tile.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-400">{tile.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 flex h-64 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-xs text-slate-400">Charts arrive in Phase 6</p>
      </Card>
    </PageContainer>
  )
}
