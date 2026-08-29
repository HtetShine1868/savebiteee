import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Clock, MapPin, PiggyBank, Search, ShoppingBag, Store } from 'lucide-react'
import { FoodImage } from '../../components/promo/FoodImage.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, StatTile } from '../../components/ui/Surface.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { Chip } from '../../components/ui/Field.jsx'
import { useToast } from '../../context/toast-context.js'
import { useReserve } from '../../context/reserve-context.js'
import { useResource } from '../../hooks/useResource.js'
import { reservationService } from '../../lib/services.js'
import { formatDateTime, formatPrice, pluralize, timeLeft } from '../../lib/format.js'
import { mealsRescued, moneySaved } from '../../lib/promotions.js'

const STATUS_BADGE = {
  reserved: { tone: 'brand', label: 'Reserved' },
  picked_up: { tone: 'neutral', label: 'Picked up' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
  expired: { tone: 'danger', label: 'Not collected' },
}

const TABS = [
  { value: 'active', label: 'To collect' },
  { value: 'history', label: 'History' },
  { value: 'all', label: 'All' },
]

function ReservationCard({ reservation, onCancel, cancelling }) {
  const promotion = reservation.promotion
  const badge = STATUS_BADGE[reservation.status] ?? STATUS_BADGE.reserved
  const countdown = timeLeft(reservation.pickupBy ?? promotion?.endsAt)
  const canCancel = reservation.status === 'reserved'

  return (
    <Card className="flex flex-col gap-4 sm:flex-row">
      <FoodImage
        src={promotion?.imageUrl}
        alt={promotion?.productName ?? 'Reserved item'}
        category={promotion?.category}
        className="h-32 w-full shrink-0 rounded-2xl sm:size-28"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-ink">
              {promotion?.id ? (
                <Link to={`/app/promotions/${promotion.id}`} className="hover:text-brand-700">
                  {promotion.productName}
                </Link>
              ) : (
                'Reserved item'
              )}
            </h3>
            {promotion?.shop ? (
              <Link
                to={`/app/shops/${promotion.shop.id}`}
                className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
              >
                <Store className="size-3.5" aria-hidden="true" />
                {promotion.shop.name}
              </Link>
            ) : null}
          </div>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
          <span className="font-semibold text-ink">{pluralize(reservation.quantity, 'portion')}</span>
          {promotion?.promoPrice != null ? (
            <span>{formatPrice(Number(promotion.promoPrice) * reservation.quantity)} at the shop</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {reservation.status === 'reserved'
              ? countdown.expired
                ? 'Pickup window closed'
                : `Collect within ${countdown.label.replace(' left', '')}`
              : formatDateTime(reservation.pickupBy ?? reservation.createdAt)}
          </span>
        </div>

        {promotion?.pickupLocation || promotion?.shop?.address ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {promotion.pickupLocation || promotion.shop.address}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {reservation.pickupCode && reservation.status === 'reserved' ? (
            <span className="rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 font-display text-sm font-extrabold tracking-[0.15em] text-brand-800">
              {reservation.pickupCode}
            </span>
          ) : null}
          {canCancel ? (
            <Button
              variant="outlineDanger"
              size="sm"
              loading={cancelling}
              onClick={() => onCancel(reservation)}
            >
              Cancel reservation
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export default function Reservations() {
  const { notify } = useToast()
  const { reservationVersion } = useReserve()
  const [tab, setTab] = useState('active')
  const [cancellingId, setCancellingId] = useState(null)

  const { data, loading, error, reload, setData } = useResource(
    (signal) => reservationService.mine(signal),
    [reservationVersion],
    { initialData: [] }
  )

  const reservations = useMemo(() => data ?? [], [data])

  const visible = useMemo(() => {
    if (tab === 'active') return reservations.filter((item) => item.status === 'reserved')
    if (tab === 'history') return reservations.filter((item) => item.status !== 'reserved')
    return reservations
  }, [reservations, tab])

  const impact = useMemo(
    () => ({ meals: mealsRescued(reservations), saved: moneySaved(reservations) }),
    [reservations]
  )

  const onCancel = async (reservation) => {
    setCancellingId(reservation.id)
    try {
      await reservationService.cancel(reservation.id)
      setData((current) =>
        (current ?? []).map((item) =>
          item.id === reservation.id ? { ...item, status: 'cancelled' } : item
        )
      )
      notify({
        tone: 'success',
        title: 'Reservation cancelled',
        description: 'The portions are back on the board for someone else.',
      })
    } catch (requestError) {
      notify({
        tone: 'error',
        title: 'Could not cancel',
        description: requestError.isMissing
          ? 'PATCH /api/reservations/:id is not live yet.'
          : requestError.message,
      })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">My reservations</h1>
        <p className="mt-1.5 text-sm text-muted">
          Show your pickup code at the shop and pay when you collect. Pickup only — no delivery.
        </p>
      </div>

      {reservations.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            icon={ShoppingBag}
            label="Portions rescued"
            value={impact.meals}
            hint="Food that would otherwise have been binned"
          />
          <StatTile
            icon={PiggyBank}
            tone="flash"
            label="Money saved"
            value={formatPrice(impact.saved)}
            hint="Compared with the original prices"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((option) => (
          <Chip key={option.value} active={tab === option.value} onClick={() => setTab(option.value)}>
            {option.label}
          </Chip>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : visible.length ? (
        <div className="space-y-4">
          {visible.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onCancel={onCancel}
              cancelling={cancellingId === reservation.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck}
          title={tab === 'active' ? 'Nothing to collect right now' : 'No past reservations yet'}
          description="Reserve a rescue deal and it will appear here with your pickup code."
          action={
            <Button as={Link} to="/app/browse" icon={Search}>
              Find food to rescue
            </Button>
          }
        />
      )}
    </div>
  )
}
