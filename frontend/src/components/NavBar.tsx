import { NavLink } from 'react-router-dom'

import { BackendStatusBadge } from './BackendStatusBadge'
import { ThemeToggle } from './ThemeToggle'

// The top navigation. <NavLink> is react-router's link that knows whether it
// points at the current page, so we can style the active tab.

const LINKS = [
  { to: '/', label: 'Live', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/guide', label: 'Guide' },
  { to: '/about', label: 'About' },
]

export function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-sm text-white">
            G
          </span>
          GestureFlow
        </NavLink>

        <ul className="flex items-center gap-1">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:block">
            <BackendStatusBadge />
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
