import { useMemo, useState } from 'react'
import { CalendarCheck, Check, Clock, Package, Phone, Search, User, X } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Surface.jsx'
import { Chip } from '../../components/ui/Field.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { useToast } from '../../context/toast-context.js'
import { useResource } from '../../hooks/useResource.js'
import { useNow } from '../../hooks/useNow.js'
import { reservationService } from '../../lib/services.js'
import { formatDateTime, formatPrice, pluralize, timeLeft } from '../../lib/format.js'

const FILTERS = [
  { value: 'reserved', label: 'To collect' },
  { value: 'picked_up', label: 'Collected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'No-show' },
  { value: 'all', label: 'All' },
]

const BADGES = {
  reserved: { tone: 'brand', label: 'Reserved' },
  picked_up: { tone: 'neutral', label: 'Collected' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
  expired: { tone: 'danger', label: 'No-show' },
}

export default function OwnerReservations() {
  const now = useNow(30_000)
  const { notify } = useToast()
  const [filter, setFilter] = useState('reserved')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload, setData } = useResource(
    (signal) => reservationService.forOwner({ limit: 200 }, signal),
    [],
    { initialData: [] }
  )

  const reservations = useMemo(() => {
    const list = data ?? []
    const byStatus = filter === 'all' ? list : list.filter((item) => item.status === filter)
    const query = search.trim().toLowerCase()
    const matched = query
      ? byStatus.filter((item) =>
          [item.pickupCode, item.customerName, item.promotion?.productName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query)
        )
      : byStatus
    return matched.sort((a, b) => new Date(a.pickupBy ?? 0) - new Date(b.pickupBy ?? 0))
  }, [data, filter, search])

  const counts = useMemo(() => {
    const result = { all: (data ?? []).length }
    for (const reservation of data ?? []) {
      result[reservation.status] = (result[reservation.status] ?? 0) + 1
    }
    return result
  }, [data])

  const setStatus = async (reservation, status) => {
    setBusyId(reservation.id)
    try {
      await reservationService.updateStatus(reservation.id, status)
      setData((current) =>
        (current ?? []).map((item) => (item.id === reservation.id ? { ...item, status } : item))
      )
      notify({
        tone: 'success',
        title:
          status === 'picked_up'
            ? 'Marked as collected'
            : status === 'cancelled'
              ? 'Reservation cancelled'
              : 'Marked as no-show',
        description:
          status === 'picked_up'
            ? 'Nice — that food is saved.'
            : 'The portions are back on the board for other customers.',
      })
    } catch (requestError) {
      notify({
        tone: 'error',
        title: 'Could not update',
        description: requestError.isMissing
          ? 'PATCH /api/reservations/:id is not live yet.'
          : requestError.message,
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Reservations</h1>
        <p className="mt-1.5 text-sm text-muted">
          Match the pickup code at the counter, then mark the order collected.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code, customer or item"
            aria-label="Search reservations"
            className="w-full rounded-full bg-surface py-3 pr-4 pl-11 text-sm text-ink ring-1 ring-line transition placeholder:text-muted/70 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Chip key={option.value} active={filter === option.value} onClick={() => setFilter(option.value)}>
            {option.label}
            {counts[option.value] ? <span className="ml-1 opacity-70">{counts[option.value]}</span> : null}
          </Chip>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : reservations.length ? (
        <div className="space-y-3">
          {reservations.map((reservation) => {
            const badge = BADGES[reservation.status] ?? BADGES.reserved
            const countdown = timeLeft(reservation.pickupBy, now)
            const isOpen = reservation.status === 'reserved'

            return (
              <Card key={reservation.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      {isOpen ? (
                        <Badge tone={countdown.urgent ? 'flash' : 'neutral'} icon={Clock}>
                          {countdown.expired ? 'Window closed' : countdown.label}
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="mt-2 font-display text-base font-bold text-ink">
                      {reservation.promotion?.productName ?? 'Reserved item'}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="size-3.5" aria-hidden="true" />
                        {reservation.customerName || 'Customer'}
                      </span>
                      {reservation.customerPhone ? (
                        <a
                          href={`tel:${reservation.customerPhone}`}
                          className="inline-flex items-center gap-1.5 transition hover:text-ink"
                        >
                          <Phone className="size-3.5" aria-hidden="true" />
                          {reservation.customerPhone}
                        </a>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="size-3.5" aria-hidden="true" />
                        {pluralize(reservation.quantity, 'portion')}
                      </span>
                      {reservation.promotion?.promoPrice != null ? (
                        <span className="font-semibold text-brand-700">
                          {formatPrice(Number(reservation.promotion.promoPrice) * reservation.quantity)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      Collect by {formatDateTime(reservation.pickupBy)}
                    </p>
                  </div>

                  {reservation.pickupCode ? (
                    <span className="rounded-2xl border border-dashed border-brand-300 bg-brand-50 px-4 py-2.5 font-display text-lg font-extrabold tracking-[0.18em] text-brand-800">
                      {reservation.pickupCode}
                    </span>
                  ) : null}
                </div>

                {isOpen ? (
                  <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                    <Button
                      size="sm"
                      icon={Check}
                      loading={busyId === reservation.id}
                      onClick={() => setStatus(reservation, 'picked_up')}
                    >
                      Mark collected
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Clock}
                      disabled={busyId === reservation.id}
                      onClick={() => setStatus(reservation, 'expired')}
                    >
                      No-show
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={X}
                      disabled={busyId === reservation.id}
                      onClick={() => setStatus(reservation, 'cancelled')}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck}
          title={filter === 'reserved' ? 'No orders waiting' : 'Nothing here'}
          description="Reservations appear the moment a customer holds one of your promotions."
        />
      )}
    </div>
  )
}
