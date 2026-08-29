import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImageIcon, Percent, Save, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Surface.jsx'
import { Chip, Input, Select, Textarea } from '../../components/ui/Field.jsx'
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { PromoCard } from '../../components/promo/PromoCard.jsx'
import { useToast } from '../../context/toast-context.js'
import { useResource } from '../../hooks/useResource.js'
import { promotionService, shopService } from '../../lib/services.js'
import { CATEGORIES, CATEGORY_BY_SLUG, computeStatus } from '../../lib/promotions.js'
import { discountPercent, formatPrice, toLocalInputValue } from '../../lib/format.js'

const EMPTY = {
  productName: '',
  categorySlug: 'bakery',
  description: '',
  imageUrl: '',
  originalPrice: '',
  promoPrice: '',
  quantityAvailable: '1',
  startsAt: '',
  endsAt: '',
  foodExpiresAt: '',
  pickupLocation: '',
}

const WINDOW_PRESETS = [
  { label: 'Next 2 hours', hours: 2 },
  { label: 'Next 4 hours', hours: 4 },
  { label: 'Until tonight', hours: 8 },
  { label: 'Next 24 hours', hours: 24 },
]

const DISCOUNT_PRESETS = [30, 40, 50, 70]

function validate(form) {
  const errors = {}
  if (!form.productName.trim()) errors.productName = 'Give the item a name customers will recognise.'
  if (!form.originalPrice) errors.originalPrice = 'Required.'
  if (!form.promoPrice) errors.promoPrice = 'Required.'
  if (
    form.originalPrice &&
    form.promoPrice &&
    Number(form.promoPrice) > Number(form.originalPrice)
  ) {
    errors.promoPrice = 'The rescue price must be lower than the original.'
  }
  if (!form.quantityAvailable || Number(form.quantityAvailable) < 0) {
    errors.quantityAvailable = 'Enter how many portions are available.'
  }
  if (!form.startsAt) errors.startsAt = 'When does the promotion start?'
  if (!form.endsAt) errors.endsAt = 'When does pickup close?'
  if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
    errors.endsAt = 'The end time must be after the start time.'
  }
  if (
    form.foodExpiresAt &&
    form.endsAt &&
    new Date(form.foodExpiresAt) < new Date(form.endsAt)
  ) {
    errors.foodExpiresAt = 'Food should still be good until the pickup window closes.'
  }
  return errors
}

export default function PromotionForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { notify } = useToast()

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const shopResource = useResource((signal) => shopService.mine(signal), [])
  const promotionResource = useResource(
    (signal) => promotionService.get(id, signal),
    [id],
    { enabled: isEdit }
  )

  useEffect(() => {
    if (isEdit) return
    const start = new Date()
    const end = new Date(start.getTime() + 4 * 3600_000)
    setForm((current) => ({
      ...current,
      startsAt: toLocalInputValue(start),
      endsAt: toLocalInputValue(end),
    }))
  }, [isEdit])

  useEffect(() => {
    const loaded = promotionResource.data
    if (!loaded) return
    setForm({
      productName: loaded.productName ?? '',
      categorySlug: loaded.category?.slug ?? 'other',
      description: loaded.description ?? '',
      imageUrl: loaded.imageUrl ?? '',
      originalPrice: String(loaded.originalPrice ?? ''),
      promoPrice: String(loaded.promoPrice ?? ''),
      quantityAvailable: String(loaded.quantityAvailable ?? '0'),
      startsAt: toLocalInputValue(loaded.startsAt),
      endsAt: toLocalInputValue(loaded.endsAt),
      foodExpiresAt: toLocalInputValue(loaded.foodExpiresAt),
      pickupLocation: loaded.pickupLocation ?? '',
    })
  }, [promotionResource.data])

  useEffect(() => {
    if (!isEdit && shopResource.data?.address) {
      setForm((current) =>
        current.pickupLocation ? current : { ...current, pickupLocation: shopResource.data.address }
      )
    }
  }, [isEdit, shopResource.data])

  const update = (field) => (event) => {
    const value = event?.target ? event.target.value : event
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const applyWindow = (hours) => {
    const start = new Date()
    setForm((current) => ({
      ...current,
      startsAt: toLocalInputValue(start),
      endsAt: toLocalInputValue(new Date(start.getTime() + hours * 3600_000)),
    }))
  }

  const applyDiscount = (percent) => {
    const original = Number(form.originalPrice)
    if (!original) return
    const next = Math.max(0, Math.round((original * (100 - percent)) / 100 / 50) * 50)
    setForm((current) => ({ ...current, promoPrice: String(next) }))
  }

  const discount = discountPercent(form.originalPrice, form.promoPrice)

  const preview = useMemo(() => {
    const draft = {
      id: 'preview',
      productName: form.productName || 'Your item name',
      description: form.description,
      imageUrl: form.imageUrl,
      originalPrice: Number(form.originalPrice) || 0,
      promoPrice: Number(form.promoPrice) || 0,
      quantityAvailable: Number(form.quantityAvailable) || 0,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
      endsAt: form.endsAt
        ? new Date(form.endsAt).toISOString()
        : new Date(Date.now() + 3600_000).toISOString(),
      foodExpiresAt: form.foodExpiresAt ? new Date(form.foodExpiresAt).toISOString() : null,
      pickupLocation: form.pickupLocation,
      category: CATEGORY_BY_SLUG[form.categorySlug] ?? CATEGORY_BY_SLUG.other,
      shopId: shopResource.data?.id ?? 'preview-shop',
      shop: shopResource.data
        ? {
            id: shopResource.data.id,
            name: shopResource.data.name,
            slug: shopResource.data.slug,
            city: shopResource.data.city,
            address: shopResource.data.address,
          }
        : { name: 'Your shop', slug: '', city: '' },
    }
    return { ...draft, status: computeStatus(draft) }
  }, [form, shopResource.data])

  const onSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      if (isEdit) await promotionService.update(id, form)
      else await promotionService.create(form)
      notify({
        tone: 'success',
        title: isEdit ? 'Promotion updated' : 'Promotion published',
        description: isEdit
          ? 'Customers see the new details straight away.'
          : 'Customers nearby can reserve it now, and favourites get an email.',
      })
      navigate('/owner/promotions')
    } catch (requestError) {
      setSubmitError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  if (isEdit && promotionResource.loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6 lg:px-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-96 rounded-4xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <Link
        to="/owner/promotions"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to promotions
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            {isEdit ? 'Edit promotion' : 'New promotion'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Tell customers what it is, how much is left, and when they can collect it.
          </p>
        </div>
        {discount > 0 ? (
          <Badge tone="flash" icon={Percent}>
            {discount}% off — saves {formatPrice(form.originalPrice - form.promoPrice)}
          </Badge>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <Card className="space-y-5">
            <h2 className="font-display text-base font-bold text-ink">The food</h2>
            <Input
              label="Product name"
              required
              placeholder="Butter croissant box (6 pcs)"
              value={form.productName}
              onChange={update('productName')}
              error={errors.productName}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="Category" value={form.categorySlug} onChange={update('categorySlug')}>
                {CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Image URL"
                icon={ImageIcon}
                placeholder="https://…"
                hint="Optional — we show a category illustration if empty."
                value={form.imageUrl}
                onChange={update('imageUrl')}
              />
            </div>
            <Textarea
              label="Description"
              placeholder="Baked this morning, still crisp. Best eaten today."
              value={form.description}
              onChange={update('description')}
            />
          </Card>

          <Card className="space-y-5">
            <h2 className="font-display text-base font-bold text-ink">Price and stock</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <Input
                label="Original price"
                type="number"
                min="0"
                step="50"
                required
                placeholder="9000"
                value={form.originalPrice}
                onChange={update('originalPrice')}
                error={errors.originalPrice}
              />
              <Input
                label="Rescue price"
                type="number"
                min="0"
                step="50"
                required
                placeholder="3600"
                value={form.promoPrice}
                onChange={update('promoPrice')}
                error={errors.promoPrice}
              />
              <Input
                label="Portions available"
                type="number"
                min="0"
                step="1"
                required
                value={form.quantityAvailable}
                onChange={update('quantityAvailable')}
                error={errors.quantityAvailable}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Quick discount</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DISCOUNT_PRESETS.map((percent) => (
                  <Chip
                    key={percent}
                    active={discount === percent}
                    onClick={() => applyDiscount(percent)}
                    className="text-xs"
                  >
                    -{percent}%
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <h2 className="font-display text-base font-bold text-ink">Pickup window</h2>
            <div>
              <p className="text-xs font-semibold text-muted">Quick presets</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WINDOW_PRESETS.map((preset) => (
                  <Chip key={preset.label} onClick={() => applyWindow(preset.hours)} className="text-xs">
                    {preset.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Promotion starts"
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={update('startsAt')}
                error={errors.startsAt}
              />
              <Input
                label="Pickup closes"
                type="datetime-local"
                required
                value={form.endsAt}
                onChange={update('endsAt')}
                error={errors.endsAt}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Food best before"
                type="datetime-local"
                hint="Optional — hides the listing once passed."
                value={form.foodExpiresAt}
                onChange={update('foodExpiresAt')}
                error={errors.foodExpiresAt}
              />
              <Input
                label="Pickup location"
                placeholder="At the counter, 42 Hledan Road"
                value={form.pickupLocation}
                onChange={update('pickupLocation')}
              />
            </div>
          </Card>

          {submitError ? <ErrorState error={submitError} compact /> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" icon={Save} loading={submitting}>
              {isEdit ? 'Save changes' : 'Publish promotion'}
            </Button>
            <Button as={Link} to="/owner/promotions" variant="ghost" size="lg">
              Cancel
            </Button>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-8">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted uppercase">
            <Sparkles className="size-3.5 text-brand-600" aria-hidden="true" />
            Customer preview
          </p>
          <PromoCard promotion={preview} />
          <p className="px-1 text-xs text-muted">
            This is exactly how your listing appears on the customer dashboard, including the countdown
            and stock badge.
          </p>
        </aside>
      </form>
    </div>
  )
}
