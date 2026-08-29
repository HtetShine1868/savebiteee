import { Loader2, PlugZap, RefreshCw, ServerCog, WifiOff } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { Button } from './Button.jsx'

export function Spinner({ className }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} aria-hidden="true" />
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

export function PromoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line/80">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-8 w-1/2 rounded-full" />
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 6, className }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <PromoCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center',
        className
      )}
    >
      {Icon ? (
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="size-7" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/**
 * One place to render every failure mode: unreachable API, route not built
 * yet, permission problems, and unexpected errors.
 */
export function ErrorState({ error, onRetry, className, compact = false }) {
  const offline = error?.isOffline
  const missing = error?.isMissing

  const Icon = offline ? WifiOff : missing ? ServerCog : PlugZap
  const title = offline
    ? 'Cannot reach the API'
    : missing
      ? 'This endpoint is not live yet'
      : 'Something went wrong'
  const description = offline
    ? 'Start the Express server in /backend (npm run dev) and make sure VITE_API_URL points at it.'
    : missing
      ? 'The screen is ready and will fill in as soon as the backend route responds.'
      : (error?.message ?? 'Unexpected error. Please try again.')

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl bg-flash-50/60 px-6 text-center ring-1 ring-flash-200',
        compact ? 'py-8' : 'py-14',
        className
      )}
      role="alert"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-flash-100 text-flash-700">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-flash-800/90">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-5">
          Try again
        </Button>
      ) : null}
    </div>
  )
}

/** Loading → error → empty → content, in the order every list screen needs it. */
export function ResourceState({ loading, error, isEmpty, onRetry, skeleton, empty, children }) {
  if (loading) return skeleton ?? <CardGridSkeleton />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (isEmpty) return empty ?? null
  return children
}
