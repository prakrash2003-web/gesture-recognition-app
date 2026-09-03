import { Card } from '../components/Card'
import { PageContainer } from '../components/PageContainer'

// The main page. In Phase 5 the left panel becomes the live webcam view with the
// hand-skeleton overlay, and the right panel shows the recognized gesture in real
// time. For now it lays out that structure with placeholders so the shell is
// reviewable.

export function LivePage() {
  return (
    <PageContainer
      title="Live recognition"
      lead="Turn on your webcam and GestureFlow streams the video to a Python backend that detects your hand and names the gesture in real time."
    >
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="flex aspect-video items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Camera view</p>
            <p className="mt-1 text-xs text-slate-400">
              Webcam capture &amp; skeleton overlay arrive in Phase 5
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Detected gesture
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-400">Not started</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Session stats
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              {['FPS', 'Latency', 'Detections'].map((label) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-mono text-slate-400">--</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
