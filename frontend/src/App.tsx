import { Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { DashboardPage } from './pages/DashboardPage'
import { GuidePage } from './pages/GuidePage'
import { LivePage } from './pages/LivePage'
import { NotFoundPage } from './pages/NotFoundPage'

// The route table. Every path renders inside <Layout /> (nav + footer); the
// matched page appears where <Layout /> puts its <Outlet />.

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LivePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
