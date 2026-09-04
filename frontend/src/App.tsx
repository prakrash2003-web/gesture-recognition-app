import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { GuidePage } from './pages/GuidePage'
import { LivePage } from './pages/LivePage'
import { ModelPage } from './pages/ModelPage'
import { NotFoundPage } from './pages/NotFoundPage'

// The Dashboard pulls in the charting library (Recharts), which is large. Loading
// it lazily keeps it out of the initial bundle so the Live page stays fast; it is
// fetched the first time the user opens /dashboard.
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LivePage />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading dashboard…</p>}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route path="guide" element={<GuidePage />} />
        <Route path="model" element={<ModelPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
