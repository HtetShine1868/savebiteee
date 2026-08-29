import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Info, MapPin, PartyPopper, Store } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { QuantityStepper } from '../ui/Field.jsx'
import { FoodImage } from './FoodImage.jsx'
import { useAuth } from '../../context/auth-context.js'
import { useToast } from '../../context/toast-context.js'
import { reservationService } from '../../lib/services.js'
import { formatDateTime, formatPrice, timeLeft } from '../../lib/format.js'

export function ReserveDialog({ promotion, open, onClose, onReserved }) {
  const { status } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const routerLocation = useLocation()

  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [reservation, setReservation] = useState(null)

  useEffect(() => {
    if (open) {
      setQuantity(1)
      setError(null)
      setReservation(null)
    }
  }, [open, promotion?.id])

  if (!promotion) return null

  const maxQuantity = Math.max(1, Math.min(10, promotion.quantityAvailable))
  const total = Number(promotion.promoPrice) * quantity
  const saving = Math.max(0, Number(promotion.originalPrice) - Number(promotion.promoPrice)) * quantity
  const countdown = timeLeft(promotion.endsAt)

  const submit = async () => {
    if (status !== 'authenticated') {
      onClose?.()
      navigate('/login', { state: { from: routerLocation.pathname } })
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const created = await reservationService.create({ promotionId: promotion.id, quantity })
      setReservation(created)
      onReserved?.(created, quantity)
      notify({
        tone: 'success',
        title: 'Reserved — pickup only',
        description: `${promotion.productName} is held for you at ${promotion.shop?.name ?? 'the shop'}.`,
      })
    } catch (requestError) {
      setError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  if (reservation) {
    return (
      <Modal open={open} onClose={onClose} title="Reservation confirmed" size="md">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-brand-50 text-brand-600">
            <PartyPopper className="size-8" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-ink">
            {promotion.productName} is yours
          </h3>
          <p className="mt-1 text-sm text-muted">
            You rescued {reservation.quantity ?? quantity} portion
            {(reservation.quantity ?? quantity) > 1 ? 's' : ''} from being thrown away.
          </p>

          {reservation.pickupCode ? (
            <div className="mt-5 w-full rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-4">
              <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                Show this code at the shop
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tracking-[0.2em] text-brand-800">
                {reservation.pickupCode}
              </p>
            </div>
          ) : null}

          <div className="mt-5 w-full space-y-2 rounded-2xl bg-canvas p-4 text-left text-sm">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Store className="size-4 text-brand-600" aria-hidden="true" />
              {promotion.shop?.name}
            </p>
            <p className="flex items-start gap-2 text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
              {promotion.pickupLocation || promotion.shop?.address}
            </p>
            <p className="flex items-center gap-2 text-muted">
              <Clock className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
              Collect by {formatDateTime(reservation.pickupBy ?? promotion.endsAt)}
            </p>
          </div>

          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
            <Button as={Link} to="/app/reservations" className="flex-1" onClick={onClose}>
              My reservations
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Keep browsing
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reserve for walk-in pickup"
      description="No payment now — you pay at the shop when you collect."
      footer={
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Total to pay at shop</p>
            <p className="font-display text-xl font-extrabold text-ink">{formatPrice(total)}</p>
          </div>
          <Button onClick={submit} loading={submitting} disabled={promotion.status !== 'active'}>
            {status === 'authenticated' ? 'Confirm reservation' : 'Sign in to reserve'}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4">
        <FoodImage
          src={promotion.imageUrl}
          alt={promotion.productName}
          category={promotion.category}
          className="size-24 shrink-0 rounded-2xl"
        />
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug font-bold text-ink">{promotion.productName}</h3>
          <p className="mt-0.5 truncate text-sm text-muted">{promotion.shop?.name}</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-lg font-extrabold text-brand-700">
              {formatPrice(promotion.promoPrice)}
            </span>
            <span className="text-sm text-muted line-through">{formatPrice(promotion.originalPrice)}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-canvas p-4">
        <div>
          <p className="text-sm font-semibold text-ink">How many?</p>
          <p className="text-xs text-muted">{promotion.quantityAvailable} available right now</p>
        </div>
        <QuantityStepper value={quantity} min={1} max={maxQuantity} onChange={setQuantity} />
      </div>

      {saving > 0 ? (
        <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          You save {formatPrice(saving)} and keep good food out of the bin.
        </p>
      ) : null}

      <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-flash-50 px-4 py-3 text-sm text-flash-800 ring-1 ring-flash-200">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <span className="font-bold">Pickup only.</span> Visit the shop to collect your order — there is
          no delivery. {countdown.expired ? 'This promotion has ended.' : `Collect within ${countdown.label.replace(' left', '')}.`}
        </p>
      </div>

      {error ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 rotate-45" aria-hidden="true" />
          {error.isMissing
            ? 'The reservation endpoint is not live yet — this will work as soon as the API is connected.'
            : error.message}
        </p>
      ) : null}
    </Modal>
  )
}
