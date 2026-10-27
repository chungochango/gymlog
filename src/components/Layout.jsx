import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Apple, Dumbbell, History, Home, Play } from 'lucide-react'
import { useApp } from '../context/AppContext'
import RestTimer from './RestTimer'
import { cn } from './ui'

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/workout', label: 'Entrenar', icon: Play },
  { to: '/nutrition', label: 'Nutrición', icon: Apple },
  { to: '/history', label: 'Historial', icon: History },
  { to: '/exercises', label: 'Ejercicios', icon: Dumbbell },
]

export default function Layout() {
  const { state } = useApp()
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh">
      <main className="mx-auto max-w-lg px-4 pb-[calc(10rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <RestTimer />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl pb-safe">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to === '/workout' && !state.active ? '/start' : to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors',
                    isActive || (to === '/workout' && pathname === '/start') ? 'text-accent' : 'text-faint hover:text-muted',
                  )
                }
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={2} />
                  {to === '/workout' && state.active && (
                    <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg animate-pulse" />
                  )}
                </span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
