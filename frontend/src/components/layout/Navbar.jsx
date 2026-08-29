import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarCheck,
  Compass,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  Sparkles,
  Store,
  User,
} from 'lucide-react'
import { Logo } from './Logo.jsx'
import { LocationChip } from './LocationChip.jsx'
import { Button } from '../ui/Button.jsx'
import { useAuth } from '../../context/auth-context.js'
import { cn } from '../../lib/cn.js'
import { initials } from '../../lib/format.js'

const LINKS = [
  { to: '/app', label: 'Discover', icon: Compass, end: true },
  { to: '/app/browse', label: 'Browse', icon: Search },
  { to: '/app/chat', label: 'Ask AI', icon: Sparkles },
]

function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const items = [
    { to: '/app/reservations', label: 'My reservations', icon: CalendarCheck },
    { to: '/app/favorites', label: 'Favourite shops', icon: Heart },
    ...(user?.role === 'owner'
      ? [{ to: '/owner', label: 'Owner console', icon: LayoutDashboard }]
      : []),
  ]

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full bg-surface p-1 pr-3 ring-1 ring-line transition hover:ring-brand-200"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {initials(user?.fullName || user?.email || 'You') || <User className="size-4" />}
          </span>
        )}
        <span className="hidden max-w-24 truncate text-sm font-semibold text-ink sm:block">
          {user?.fullName?.split(' ')[0] || 'Account'}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl bg-surface p-1.5 ring-1 ring-line shadow-lift"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-bold text-ink">{user?.fullName || 'Signed in'}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 uppercase">
                {user?.role === 'owner' ? <Store className="size-3" /> : <User className="size-3" />}
                {user?.role}
              </span>
            </div>
            <div className="my-1 h-px bg-line" />
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
              >
                <item.icon className="size-4 text-muted" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false)
                await logout()
                navigate('/')
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const { status } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-shadow duration-300',
        scrolled ? 'glass shadow-card' : 'bg-canvas'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo to="/app" className="shrink-0" />

        <nav className="mx-auto hidden items-center gap-1 rounded-full bg-surface/70 p-1 ring-1 ring-line md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                  isActive ? 'bg-ink text-white shadow-sm' : 'text-muted hover:bg-canvas hover:text-ink'
                )
              }
            >
              <link.icon className="size-4" aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LocationChip className="hidden sm:inline-flex" />
          {status === 'authenticated' ? (
            <UserMenu />
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
              </Button>
              <Button as={Link} to="/register" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
