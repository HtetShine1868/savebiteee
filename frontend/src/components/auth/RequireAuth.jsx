import { Navigate, useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../../context/auth-context.js'

function FullPageLoader() {
  return (
    <div className="grid min-h-svh place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <span className="grid size-12 animate-pulse place-items-center rounded-2xl bg-brand-500 text-white">
          <Leaf className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-muted">Loading your session…</p>
      </div>
    </div>
  )
}

export function RequireAuth({ role, children }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageLoader />

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'owner' ? '/owner' : '/app'} replace />
  }

  return children
}
