import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CircleDollarSign,
  Clock,
  PackageOpen,
  PlusCircle,
  Store,
  Tags,
} from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, StatTile } from '../../components/ui/Surface.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { FoodImage } from '../../components/promo/FoodImage.jsx'
import { useAuth } from '../../context/auth-context.js'
import { useResource } from '../../hooks/useResource.js'
import { useNow } from '../../hooks/useNow.js'
import { promotionService, reservationService, shopService } from '../../lib/services.js'
import { computeStatus } from '../../lib/promotions.js'
import { formatDateTime, formatPrice, pluralize, timeLeft } from '../../lib/format.js'

function ShopSetupBanner() {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-brand-600 to-brand-800 text-white ring-0">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold">Finish your shop profile</h2>
        <p className="mt-1 max-w-lg text-sm text-white/80">
          Customers see your name, photo, address and opening hours before they reserve. Complete it once
          and start posting promotions.
        </p>
      </div>
      <Button as={Link} to="/owner/shop" className="bg-white text-brand-800 hover:bg-brand-50" icon={Store}>
        Set up shop
      </Button>
    </Card>
  )
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  const now = useNow(30_000)

  const shopResource = useResource((signal) => shopService.mine(signal), [])
  const promotionsResource = useResource(
    (signal) => promotionService.listForOwner({ limit: 100 }, signal),
    [],
    { initialData: [] }
  )
  const reservationsResource = useResource(
    (signal) => reservationService.forOwner({ limit: 50 }, signal),
    [],
    { initialData: [] }
  )

  const promotions = useMemo(() => promotionsResource.data ?? [], [promotionsResource.data])
  const reservations = useMemo(() => reservationsResource.data ?? [], [reservationsResource.data])

  const stats = useMemo(() => {
    const withStatus = promotions.map((promotion) => ({
      ...promotion,
      liveStatus: promotion.status ?? computeStatus(promotion, now),
    }))
    const active = withStatus.filter((promotion) => promotion.liveStatus === 'active')
    const soldOut = withStatus.filter((promotion) => promotion.liveStatus === 'sold_out')
    const endingSoon = active
      .filter((promotion) => timeLeft(promotion.endsAt, now).urgent)
      .sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt))

    const open = reservations.filter((reservation) => reservation.status === 'reserved')
    const collected = reservations.filter((reservation) => reservation.status === 'picked_up')
    const rescuedValue = [...open, ...collected].reduce(
      (total, reservation) =>
        total + Number(reservation.promotion?.promoPrice ?? 0) * reservation.quantity,
      0
    )

    return {
      withStatus,
      active,
      soldOut,
      endingSoon,
      open,
      collected,
      rescuedValue,
      portions: [...open, ...collected].reduce((total, item) => total + item.quantity, 0),
    }
  }, [promotions, reservations, now])

  const loading = promotionsResource.loading || reservationsResource.loading
  const error = promotionsResource.error ?? reservationsResource.error

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700">
            {shopResource.data?.name ?? user?.fullName ?? 'Your shop'}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            Today at a glance
          </h1>
        </div>
        <Button as={Link} to="/owner/promotions/new" icon={PlusCircle}>
          New promotion
        </Button>
      </div>

      {!shopResource.loading && !shopResource.data ? <ShopSetupBanner /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Tags} label="Live listings" value={stats.active.length} />
        <StatTile
          icon={CalendarCheck}
          tone="spark"
          label="Awaiting pickup"
          value={stats.open.length}
          hint={pluralize(stats.portions, 'portion')}
        />
        <StatTile
          icon={CircleDollarSign}
          tone="flash"
          label="Value rescued"
          value={formatPrice(stats.rescuedValue)}
          hint="Reserved and collected"
        />
        <StatTile
          icon={PackageOpen}
          tone="neutral"
          label="Sold out"
          value={stats.soldOut.length}
          hint="Consider relisting"
        />
      </div>

      {error ? <ErrorState error={error} onRetry={promotionsResource.reload} /> : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">Ending soon</h2>
            <Link
              to="/owner/promotions"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              All promotions
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-32 rounded-3xl" />
          ) : stats.endingSoon.length ? (
            <div className="space-y-3">
              {stats.endingSoon.slice(0, 4).map((promotion) => {
                const countdown = timeLeft(promotion.endsAt, now)
                return (
                  <Card key={promotion.id} className="flex items-center gap-4" padded={false}>
                    <FoodImage
                      src={promotion.imageUrl}
                      alt={promotion.productName}
                      category={promotion.category}
                      className="size-20 shrink-0 rounded-l-3xl"
                    />
                    <div className="min-w-0 flex-1 py-3">
                      <h3 className="truncate font-display text-sm font-bold text-ink">
                        {promotion.productName}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted">
                        {promotion.quantityAvailable} left · {formatPrice(promotion.promoPrice)}
                      </p>
                      <Badge tone="flash" icon={Clock} className="mt-2">
                        {countdown.label}
                      </Badge>
                    </div>
                    <Button
                      as={Link}
                      to={`/owner/promotions/${promotion.id}/edit`}
                      variant="ghost"
                      size="sm"
                      className="mr-3"
                    >
                      Edit
                    </Button>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Nothing closing in the next hours"
              description="When a promotion nears its end time it appears here so you can extend or discount it."
              className="py-10"
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">Latest reservations</h2>
            <Link
              to="/owner/reservations"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
            >
              Inbox
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-32 rounded-3xl" />
          ) : reservations.length ? (
            <div className="space-y-3">
              {reservations.slice(0, 5).map((reservation) => (
                <Card key={reservation.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-bold text-ink">
                      {reservation.promotion?.productName ?? 'Reserved item'}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {reservation.customerName || 'Customer'} ·{' '}
                      {pluralize(reservation.quantity, 'portion')}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Collect by {formatDateTime(reservation.pickupBy)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={reservation.status === 'reserved' ? 'brand' : 'neutral'}>
                      {reservation.status.replace('_', ' ')}
                    </Badge>
                    {reservation.pickupCode ? (
                      <span className="font-display text-xs font-extrabold tracking-widest text-brand-700">
                        {reservation.pickupCode}
                      </span>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No reservations yet"
              description="Post a promotion with a clear pickup window — customers nearby get notified."
              className="py-10"
              action={
                <Button as={Link} to="/owner/promotions/new" icon={PlusCircle}>
                  Create promotion
                </Button>
              }
            />
          )}
        </section>
      </div>
    </div>
  )
}
