import { NavLink } from 'react-router-dom'
import { CalendarCheck, Compass, Heart, Search, Sparkles } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const TABS = [
  { to: '/app', label: 'Discover', icon: Compass, end: true },
  { to: '/app/browse', label: 'Browse', icon: Search },
  { to: '/app/chat', label: 'Ask AI', icon: Sparkles, accent: true },
  { to: '/app/favorites', label: 'Saved', icon: Heart },
  { to: '/app/reservations', label: 'Orders', icon: CalendarCheck },
]

export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-0 bottom-0 z-50 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex items-stretch justify-around px-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition',
                isActive ? 'text-brand-700' : 'text-muted'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-2xl transition',
                    isActive
                      ? tab.accent
                        ? 'bg-spark-600 text-white'
                        : 'bg-brand-100 text-brand-700'
                      : 'text-muted'
                  )}
                >
                  <tab.icon className="size-5" aria-hidden="true" />
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
