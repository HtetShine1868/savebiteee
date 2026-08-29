import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Leaf, MapPin, Sparkles } from 'lucide-react'
import { Logo } from '../layout/Logo.jsx'

const HIGHLIGHTS = [
  { icon: Sparkles, text: 'Ask the AI what you feel like eating tonight' },
  { icon: Clock, text: 'Live stock and countdowns, never a wasted trip' },
  { icon: MapPin, text: 'Walk-in pickup from shops around the corner' },
]

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 size-80 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute bottom-0 -right-10 size-72 rounded-full bg-spark-500/20 blur-3xl" />
        </div>

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Back to home">
            <span className="grid size-10 place-items-center rounded-2xl bg-brand-500 text-white">
              <Leaf className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display leading-none">
              <span className="block text-base font-extrabold tracking-tight">Food Waste</span>
              <span className="block text-xs font-bold tracking-[0.22em] text-brand-300 uppercase">
                Solver
              </span>
            </span>
          </Link>
        </div>

        <div className="relative mt-auto">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight">
            Every rescued meal is money saved and waste avoided.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm text-white/80">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <item.icon className="size-4 text-brand-300" aria-hidden="true" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
          <p className="mt-10 font-display text-sm font-bold text-brand-300">
            Save Food. Save Money. Reduce Waste. ♻️
          </p>
        </div>
      </div>

      <div className="flex min-h-svh flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}
