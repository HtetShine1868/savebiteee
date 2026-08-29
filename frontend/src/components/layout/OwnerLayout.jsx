import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Store,
  Tags,
} from 'lucide-react'
import { Logo } from './Logo.jsx'
import { Button } from '../ui/Button.jsx'
import { useAuth } from '../../context/auth-context.js'
import { cn } from '../../lib/cn.js'
import { initials } from '../../lib/format.js'

const NAV = [
  { to: '/owner', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/owner/promotions', label: 'Promotions', icon: Tags },
  { to: '/owner/reservations', label: 'Reservations', icon: CalendarCheck },
  { to: '/owner/shop', label: 'Shop profile', icon: Store },
]

export function OwnerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden border-r border-line bg-surface/70 lg:flex lg:h-svh lg:flex-col lg:sticky lg:top-0">
        <div className="px-5 py-5">
          <Logo to="/owner" />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition',
                  isActive ? 'bg-ink text-white shadow-sm' : 'text-muted hover:bg-canvas hover:text-ink'
                )
              }
            >
              <item.icon className="size-4.5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}

          <Button as={Link} to="/owner/promotions/new" icon={PlusCircle} className="mt-4 w-full">
            New promotion
          </Button>
        </nav>

        <div className="space-y-2 border-t border-line p-3">
          <Link
            to="/app"
            className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-muted transition hover:bg-canvas hover:text-ink"
          >
            <ExternalLink className="size-4.5" aria-hidden="true" />
            Customer view
          </Link>
          <div className="flex items-center gap-3 rounded-2xl px-3.5 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700">
              {initials(user?.fullName || 'Shop')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{user?.fullName || 'Owner'}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate('/')
              }}
              aria-label="Sign out"
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="glass sticky top-0 z-40 flex items-center gap-3 border-b border-line px-4 py-3 lg:hidden">
          <Logo to="/owner" showText={false} />
          <p className="font-display text-sm font-bold text-ink">Owner console</p>
          <Button as={Link} to="/owner/promotions/new" size="sm" icon={PlusCircle} className="ml-auto">
            New
          </Button>
        </header>

        <main className="flex-1 pb-24 lg:pb-10">
          <Outlet />
        </main>

        <nav
          aria-label="Owner sections"
          className="glass fixed inset-x-0 bottom-0 z-40 flex border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition',
                  isActive ? 'text-brand-700' : 'text-muted'
                )
              }
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
