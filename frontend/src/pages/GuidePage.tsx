import { Card } from '../components/Card'
import { GestureCard } from '../components/GestureCard'
import { PageContainer } from '../components/PageContainer'
import { useGestures } from '../hooks/useGestures'

// Lists every gesture the backend supports. The list is fetched from GET /gestures
// (not hard-coded here) so this page always matches what the recognizer can do.

export function GuidePage() {
  const { gestures, loading, error } = useGestures()

  return (
    <PageContainer
      title="Gesture guide"
      lead="The six gestures GestureFlow recognizes. This list comes straight from the backend."
    >
      {loading && <p className="text-sm text-slate-500">Loading gestures...</p>}

      {error && (
        <Card className="border-rose-200 dark:border-rose-900">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
            Couldn't load gestures
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {error}. Is the backend running at the configured URL?
          </p>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {gestures.map((gesture) => (
            <GestureCard key={gesture.id} gesture={gesture} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
