import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Logo } from '../components/layout/Logo.jsx'

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="text-center">
        <Logo className="justify-center" />
        <p className="mt-8 font-display text-6xl font-extrabold tracking-tight text-brand-600">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink">This page went to the bin</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          The link may be old, or the promotion it pointed to has already been rescued.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/app" icon={Compass}>
            Browse rescues
          </Button>
          <Button as={Link} to="/" variant="secondary" icon={Home}>
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}
