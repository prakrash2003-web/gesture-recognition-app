import { Card } from '../components/Card'
import { ConfusionMatrix } from '../components/ConfusionMatrix'
import { PageContainer } from '../components/PageContainer'
import { useGestures } from '../hooks/useGestures'
import { useModelInfo } from '../hooks/useModelInfo'
import type { ModelMetrics, ModelReport } from '../types'

// Rule-based vs. trained-ML comparison. Data comes from GET /model, which serves
// the report `python -m ml.train` writes to backend/ml/reports/comparison.json.

const METRIC_COLUMNS: Array<[keyof ModelMetrics, string]> = [
  ['accuracy', 'Accuracy'],
  ['precision_macro', 'Precision'],
  ['recall_macro', 'Recall'],
  ['f1_macro', 'F1 (macro)'],
]

export function ModelPage() {
  const { info, loading, error } = useModelInfo()
  const { gestures } = useGestures()
  const gestureNames = Object.fromEntries(gestures.map((g) => [g.id, g.name]))

  return (
    <PageContainer
      title="Model comparison"
      lead="GestureFlow ships a hand-written rule-based classifier as its baseline and can also run a trained scikit-learn model. This page compares them."
    >
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {info && !info.report && <NoReport mlAvailable={info.ml_available} />}

      {info?.report && (
        <ModelReportView report={info.report} gestureNames={gestureNames} />
      )}
    </PageContainer>
  )
}

function NoReport({ mlAvailable }: { mlAvailable: boolean }) {
  return (
    <Card>
      <h3 className="font-medium text-slate-900 dark:text-white">No comparison report yet</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        The rule-based classifier is running. To train and compare an ML model, collect a
        labelled landmark dataset and run the training pipeline:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-950">
        {`cd backend
python scripts/record_fixtures.py --gesture open_palm --session s1
# ...repeat for every gesture and 2+ sessions...
python -m ml.train`}
      </pre>
      <p className="mt-2 text-xs text-slate-400">
        ML model currently {mlAvailable ? 'available' : 'not available'} on the backend.
      </p>
    </Card>
  )
}

function ModelReportView({
  report,
  gestureNames,
}: {
  report: ModelReport
  gestureNames: Record<string, string>
}) {
  const modelNames = Object.keys(report.models)
  const rule = report.models.rule_based
  const selected = report.models[report.selected_model]

  return (
    <div className="space-y-6">
      {report.provisional && (
        <div className="rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <strong>Provisional results.</strong> This model was trained on{' '}
          <em>synthetic</em> hands to verify the pipeline. Collect real webcam data and
          re-run <code>python -m ml.train</code> to replace it.
        </div>
      )}

      <p className="text-sm text-slate-500">
        {report.dataset} dataset · {report.n_samples} samples · split{' '}
        <code>{report.split}</code> ({report.n_train} train / {report.n_test} test) ·
        scikit-learn {report.sklearn_version} · {report.generated_at}
      </p>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-4">Model</th>
                {METRIC_COLUMNS.map(([, label]) => (
                  <th key={label} className="py-1.5 pr-4">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelNames.map((name) => {
                const m = report.models[name]
                const isSelected = name === report.selected_model
                const isBaseline = name === 'rule_based'
                return (
                  <tr
                    key={name}
                    className={
                      isSelected
                        ? 'font-medium text-brand-700 dark:text-brand-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }
                  >
                    <td className="py-1.5 pr-4">
                      {name}
                      {isSelected && ' ★'}
                      {isBaseline && ' (baseline)'}
                    </td>
                    {METRIC_COLUMNS.map(([key]) => (
                      <td key={key} className="py-1.5 pr-4 tabular-nums">
                        {(m[key] as number).toFixed(3)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          ★ selected model. Precision / recall / F1 are macro-averaged across the six
          gestures.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Rule-based — confusion matrix
          </h3>
          <ConfusionMatrix
            matrix={rule.confusion_matrix}
            labels={rule.confusion_labels}
            gestureNames={gestureNames}
          />
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            {report.selected_model} — confusion matrix
          </h3>
          <ConfusionMatrix
            matrix={selected.confusion_matrix}
            labels={selected.confusion_labels}
            gestureNames={gestureNames}
          />
        </Card>
      </div>

      {report.notes.length > 0 && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Notes</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {report.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-sm text-slate-500">
        Switch the recognition engine for a live session from the{' '}
        <strong>Settings</strong> panel on the Live page.
      </p>
    </div>
  )
}
