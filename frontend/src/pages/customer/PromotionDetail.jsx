import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  Phone,
  Store,
  Tag,
} from 'lucide-react'
import { FoodImage } from '../../components/promo/FoodImage.jsx'
import { FavoriteButton } from '../../components/promo/FavoriteButton.jsx'
import { PromoRail } from '../../components/promo/PromoRail.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Surface.jsx'
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { useReserve } from '../../context/reserve-context.js'
import { useResource } from '../../hooks/useResource.js'
import { usePromotionFeed } from '../../hooks/usePromotionFeed.js'
import { useNow } from '../../hooks/useNow.js'
import { promotionService } from '../../lib/services.js'
import { STATUS_META, computeStatus } from '../../lib/promotions.js'
import {
  discountPercent,
  formatDateTime,
  formatDistance,
  formatPrice,
  timeLeft,
} from '../../lib/format.js'
import { cn } from '../../lib/cn.js'

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-40" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Skeleton className="aspect-[4/3] rounded-4xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, tone = 'default' }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-xl',
          tone === 'flash' ? 'bg-flash-50 text-flash-600' : 'bg-brand-50 text-brand-600'
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}

export default function PromotionDetail() {
  const { id } = useParams()
  const now = useNow(15_000)
  const { openReserve, reservationVersion } = useReserve()

  const { data: promotion, loading, error, reload } = useResource(
    (signal) => promotionService.get(id, signal),
    [id, reservationVersion]
  )

  const { promotions: feed } = usePromotionFeed({ availableOnly: 1, limit: 30 })

  const related = useMemo(() => {
    if (!promotion) return []
    return feed
      .filter(
        (item) =>
          item.id !== promotion.id &&
          (item.category?.slug === promotion.category?.slug || item.shopId === promotion.shopId)
      )
      .slice(0, 10)
  }, [feed, promotion])

  if (loading) return <DetailSkeleton />
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState error={error} onRetry={reload} />
        <div className="mt-6 text-center">
          <Button as={Link} to="/app/browse" variant="secondary" icon={ArrowLeft}>
            Back to browse
          </Button>
        </div>
      </div>
    )
  }
  if (!promotion) return null

  const status = promotion.status ?? computeStatus(promotion, now)
  const statusMeta = STATUS_META[status] ?? STATUS_META.active
  const countdown = timeLeft(promotion.endsAt, now)
  const discount = discountPercent(promotion.originalPrice, promotion.promoPrice)
  const distance = formatDistance(promotion.distanceKm)
  const reservable = status === 'active'
  const mapsHref = promotion.shop?.latitude
    ? `https://www.google.com/maps/search/?api=1&query=${promotion.shop.latitude},${promotion.shop.longitude}`
    : promotion.shop?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(promotion.shop.address)}`
      : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/app/browse"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to listings
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div className="relative overflow-hidden rounded-4xl ring-1 ring-line/80 shadow-card">
          <FoodImage
            src={promotion.imageUrl}
            alt={promotion.productName}
            category={promotion.category}
            className="aspect-[4/3] w-full"
          />
          <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
            {discount > 0 ? (
              <span className="rounded-full bg-flash-500 px-3 py-1.5 font-display text-sm font-extrabold text-white shadow-sm">
                -{discount}% off
              </span>
            ) : null}
            <Badge tone={status === 'active' ? 'brand' : 'inverse'}>{statusMeta.label}</Badge>
          </div>
          {promotion.shop ? (
            <div className="absolute top-4 right-4">
              <FavoriteButton shop={promotion.shop} />
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
            <span aria-hidden="true">{promotion.category?.emoji}</span>
            {promotion.category?.name}
          </div>
          <h1 className="mt-2 font-display text-3xl leading-tight font-extrabold tracking-tight text-ink sm:text-4xl">
            {promotion.productName}
          </h1>

          {promotion.shop ? (
            <Link
              to={`/app/shops/${promotion.shop.id}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink"
            >
              <Store className="size-4" aria-hidden="true" />
              {promotion.shop.name}
              {distance ? <span className="text-muted">· {distance} away</span> : null}
            </Link>
          ) : null}

          <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="font-display text-4xl font-extrabold tracking-tight text-brand-700">
              {formatPrice(promotion.promoPrice)}
            </p>
            {discount > 0 ? (
              <p className="pb-1 text-base text-muted line-through">
                {formatPrice(promotion.originalPrice)}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={countdown.urgent ? 'flash' : 'neutral'} icon={Clock}>
              {countdown.label}
            </Badge>
            <Badge tone={promotion.quantityAvailable <= 3 ? 'flash' : 'neutral'} icon={Package}>
              {promotion.quantityAvailable} available
            </Badge>
            {discount > 0 ? (
              <Badge tone="brand" icon={Tag}>
                You save {formatPrice(promotion.originalPrice - promotion.promoPrice)}
              </Badge>
            ) : null}
          </div>

          {promotion.description ? (
            <p className="mt-5 text-sm leading-relaxed text-muted text-balance-pretty">
              {promotion.description}
            </p>
          ) : null}

          <Card className="mt-6 space-y-4">
            <InfoRow
              icon={MapPin}
              label="Pickup location"
              value={promotion.pickupLocation || promotion.shop?.address}
            />
            <InfoRow
              icon={CalendarClock}
              label="Collect between"
              value={`${formatDateTime(promotion.startsAt)} → ${formatDateTime(promotion.endsAt)}`}
            />
            {promotion.foodExpiresAt ? (
              <InfoRow
                icon={AlertTriangle}
                label="Best before"
                value={formatDateTime(promotion.foodExpiresAt)}
                tone="flash"
              />
            ) : null}
            {promotion.shop?.phone ? (
              <InfoRow icon={Phone} label="Shop phone" value={promotion.shop.phone} />
            ) : null}
          </Card>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-flash-50 px-4 py-3 text-sm text-flash-800 ring-1 ring-flash-200">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-bold">Pickup only.</span> Please visit the shop to collect your order —
              we do not deliver.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => openReserve(promotion)} disabled={!reservable}>
              {reservable ? 'Reserve for pickup' : statusMeta.label}
            </Button>
            {mapsHref ? (
              <Button
                as="a"
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                size="lg"
                variant="secondary"
                iconRight={ExternalLink}
              >
                Open in Maps
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {related.length ? (
        <div className="mt-16">
          <PromoRail
            title="You might also rescue"
            emoji="♻️"
            promotions={related}
            onReserve={openReserve}
            now={now}
          />
        </div>
      ) : null}
    </div>
  )
}
