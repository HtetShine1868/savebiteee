import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Package, Pencil, PlusCircle, Tags, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Surface.jsx'
import { Chip } from '../../components/ui/Field.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { FoodImage } from '../../components/promo/FoodImage.jsx'
import { useToast } from '../../context/toast-context.js'
import { useResource } from '../../hooks/useResource.js'
import { useNow } from '../../hooks/useNow.js'
import { promotionService } from '../../lib/services.js'
import { STATUS_META, computeStatus } from '../../lib/promotions.js'
import { discountPercent, formatDateTime, formatPrice, timeLeft } from '../../lib/format.js'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Live' },
  { value: 'upcoming', label: 'Scheduled' },
  { value: 'sold_out', label: 'Sold out' },
  { value: 'expired', label: 'Expired' },
]

export default function OwnerPromotions() {
  const now = useNow(30_000)
  const { notify } = useToast()
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { data, loading, error, reload, setData } = useResource(
    (signal) => promotionService.listForOwner({ limit: 200 }, signal),
    [],
    { initialData: [] }
  )

  const promotions = useMemo(() => {
    const list = (data ?? []).map((promotion) => ({
      ...promotion,
      liveStatus: promotion.status ?? computeStatus(promotion, now),
    }))
    const sorted = list.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    return filter === 'all' ? sorted : sorted.filter((promotion) => promotion.liveStatus === filter)
  }, [data, filter, now])

  const counts = useMemo(() => {
    const result = { all: (data ?? []).length }
    for (const promotion of data ?? []) {
      const status = promotion.status ?? computeStatus(promotion, now)
      result[status] = (result[status] ?? 0) + 1
    }
    return result
  }, [data, now])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await promotionService.remove(pendingDelete.id)
      setData((current) => (current ?? []).filter((item) => item.id !== pendingDelete.id))
      notify({ tone: 'success', title: 'Promotion removed' })
      setPendingDelete(null)
    } catch (requestError) {
      notify({
        tone: 'error',
        title: 'Could not delete',
        description: requestError.isMissing
          ? 'DELETE /api/promotions/:id is not live yet.'
          : requestError.message,
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Promotions</h1>
          <p className="mt-1.5 text-sm text-muted">
            Everything you have listed. Expired and sold-out items disappear from the customer app
            automatically.
          </p>
        </div>
        <Button as={Link} to="/owner/promotions/new" icon={PlusCircle}>
          New promotion
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Chip key={option.value} active={filter === option.value} onClick={() => setFilter(option.value)}>
            {option.label}
            {counts[option.value] ? (
              <span className="ml-1 opacity-70">{counts[option.value]}</span>
            ) : null}
          </Chip>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : promotions.length ? (
        <div className="space-y-3">
          {promotions.map((promotion) => {
            const meta = STATUS_META[promotion.liveStatus] ?? STATUS_META.active
            const countdown = timeLeft(promotion.endsAt, now)
            const discount = discountPercent(promotion.originalPrice, promotion.promoPrice)

            return (
              <Card key={promotion.id} padded={false} className="flex flex-col sm:flex-row sm:items-center">
                <FoodImage
                  src={promotion.imageUrl}
                  alt={promotion.productName}
                  category={promotion.category}
                  className="h-36 w-full shrink-0 rounded-t-3xl sm:h-28 sm:w-32 sm:rounded-l-3xl sm:rounded-tr-none"
                />

                <div className="min-w-0 flex-1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {discount > 0 ? <Badge tone="flash">-{discount}%</Badge> : null}
                    <span className="text-xs text-muted">{promotion.category?.name}</span>
                  </div>
                  <h2 className="mt-1.5 truncate font-display text-base font-bold text-ink">
                    {promotion.productName}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="font-semibold text-brand-700">
                      {formatPrice(promotion.promoPrice)}
                    </span>
                    <span className="line-through">{formatPrice(promotion.originalPrice)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Package className="size-3.5" aria-hidden="true" />
                      {promotion.quantityAvailable} left
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {promotion.liveStatus === 'upcoming'
                        ? `Starts ${formatDateTime(promotion.startsAt)}`
                        : countdown.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-line p-3 sm:border-t-0 sm:border-l sm:pr-4">
                  <Button
                    as={Link}
                    to={`/owner/promotions/${promotion.id}/edit`}
                    variant="secondary"
                    size="sm"
                    icon={Pencil}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setPendingDelete(promotion)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Tags}
          title={filter === 'all' ? 'No promotions yet' : 'Nothing in this state'}
          description="List surplus stock with a discount and a pickup window — it appears instantly for nearby customers."
          action={
            <Button as={Link} to="/owner/promotions/new" icon={PlusCircle}>
              Create your first promotion
            </Button>
          }
        />
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this promotion?"
        description="Customers with an existing reservation will keep it — this only removes the listing."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{pendingDelete?.productName}</span> will no longer be
          visible to customers.
        </p>
      </Modal>
    </div>
  )
}
