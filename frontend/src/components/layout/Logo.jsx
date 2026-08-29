import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export function Logo({ to = '/', className, showText = true, compact = false }) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Food Waste Solver home"
    >
      <span className="relative grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-sm transition-transform duration-300 group-hover:-rotate-6">
        <Leaf className="size-5" aria-hidden="true" />
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-flash-400 ring-2 ring-canvas" />
      </span>
      {showText ? (
        <span className="font-display leading-none">
          <span className={cn('block font-extrabold tracking-tight text-ink', compact ? 'text-sm' : 'text-base')}>
            Food Waste
          </span>
          <span className="block text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
            Solver
          </span>
        </span>
      ) : null}
    </Link>
  )
}
