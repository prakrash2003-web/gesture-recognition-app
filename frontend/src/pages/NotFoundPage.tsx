import { Link } from 'react-router-dom'

import { PageContainer } from '../components/PageContainer'

export function NotFoundPage() {
  return (
    <PageContainer title="Page not found" lead="That route doesn't exist.">
      <Link
        to="/"
        className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to Live
      </Link>
    </PageContainer>
  )
}
