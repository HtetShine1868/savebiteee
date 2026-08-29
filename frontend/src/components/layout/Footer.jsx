import { Link } from 'react-router-dom'
import { Logo } from './Logo.jsx'

const COLUMNS = [
  {
    title: 'Discover',
    links: [
      { to: '/app', label: 'Available now' },
      { to: '/app/browse?endingSoon=1', label: 'Ending soon' },
      { to: '/app/chat', label: 'Ask the AI' },
    ],
  },
  {
    title: 'For shops',
    links: [
      { to: '/register?role=owner', label: 'List your surplus' },
      { to: '/owner', label: 'Owner console' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">
            Good food should be eaten, not binned. We connect shops with surplus stock to neighbours who
            can collect it the same day, at rescue prices.
          </p>
          <p className="mt-4 font-display text-sm font-bold text-brand-700">
            Save Food. Save Money. Reduce Waste. ♻️
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-xs font-bold tracking-[0.14em] text-ink uppercase">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="text-sm text-muted transition hover:text-brand-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs text-muted sm:px-6 lg:px-8">
        Built for the hackathon · Walk-in pickup only, no delivery
      </div>
    </footer>
  )
}
