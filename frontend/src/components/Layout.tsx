import { Outlet } from 'react-router-dom'

import { NavBar } from './NavBar'

// The frame every page renders inside. <Outlet /> is where react-router injects
// the component for the current route.

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <NavBar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
        GestureFlow &middot; hand-gesture recognition &middot;{' '}
        <a
          href="https://github.com/prakrash2003-web/gesture-recognition-app"
          className="underline hover:text-slate-700 dark:hover:text-slate-300"
          target="_blank"
          rel="noreferrer"
        >
          source on GitHub
        </a>
      </footer>
    </div>
  )
}
