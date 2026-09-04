import { Card } from '../components/Card'
import { PageContainer } from '../components/PageContainer'

// Explains what the project is and how it works - useful for a portfolio visitor
// and as a script for talking through the architecture in an interview.

const PIPELINE = [
  ['React frontend', 'Captures webcam frames and downscales them in the browser.'],
  ['WebSocket', 'One persistent connection streams frames up and results down.'],
  ['FastAPI backend', 'Receives each frame and runs the vision pipeline.'],
  ['MediaPipe', 'Locates the hand and returns 21 landmark points.'],
  [
    'Classifier',
    'A hand-written rule-based baseline, or a trained scikit-learn model, names the gesture.',
  ],
  ['Result', 'Streamed back as JSON; the UI draws the skeleton and the label.'],
]

const STACK = [
  ['Frontend', 'React, TypeScript, Vite, Tailwind CSS, React Router, Recharts'],
  ['Backend', 'Python, FastAPI, Uvicorn, WebSockets'],
  ['Computer vision', 'OpenCV, MediaPipe Hands, NumPy'],
  ['Machine learning', 'scikit-learn (logistic regression / random forest / SVM), joblib'],
  ['Tooling', 'pytest, Vitest, ruff, oxlint, GitHub Actions'],
]

export function AboutPage() {
  return (
    <PageContainer
      title="About this project"
      lead="GestureFlow is a portfolio project demonstrating a real-time computer-vision pipeline with a clean frontend/backend split."
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">How it works</h2>
          <ol className="space-y-2">
            {PIPELINE.map(([name, detail], i) => (
              <li key={name} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-700 dark:text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-white">{name}.</span>{' '}
                  {detail}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Technology</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {STACK.map(([area, tools]) => (
              <Card key={area}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {area}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{tools}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Why server-side computer vision</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            MediaPipe can run in the browser, but doing the detection and
            classification in Python keeps the interesting logic - landmark
            normalization, the classifier, temporal smoothing - in one tested
            codebase, and makes the computer-vision work a real, demonstrable part
            of the project rather than a hidden library call.
          </p>
        </section>
      </div>
    </PageContainer>
  )
}
