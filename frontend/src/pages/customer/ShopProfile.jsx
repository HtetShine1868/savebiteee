import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Mail, MapPin, PackageOpen, Phone, Store } from 'lucide-react'
import { PromoGrid } from '../../components/promo/PromoGrid.jsx'
import { FavoriteButton } from '../../components/promo/FavoriteButton.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { CardGridSkeleton, EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { useReserve } from '../../context/reserve-context.js'
import { useSession } from '../../context/session-context.js'
import { useResource } from '../../hooks/useResource.js'
import { useNow } from '../../hooks/useNow.js'
import { promotionService, shopService } from '../../lib/services.js'
import {
  CATEGORY_BY_SLUG,
  filterPromotions,
  haversineKm,
  sortPromotions,
  withDistance,
} from '../../lib/promotions.js'
import { formatDistance, initials } from '../../lib/format.js'

export default function ShopProfile() {
  const { slug } = useParams()
  const now = useNow(30_000)
  const { openReserve, reservationVersion } = useReserve()
  const { location } = useSession()

  const { data, loading, error, reload } = useResource(
    (signal) => shopService.getBySlug(slug, signal),
    [slug, reservationVersion]
  )

  const shop = data?.shop ?? null
  const bundled = useMemo(() => data?.promotions ?? [], [data])

  const { data: fetchedPromotions } = useResource(
    (signal) => promotionService.list({ shopId: shop?.id, limit: 60 }, signal),
    [shop?.id, reservationVersion],
    { enabled: Boolean(shop?.id) && bundled.length === 0, initialData: [] }
  )

  const promotions = useMemo(() => {
    const source = bundled.length ? bundled : (fetchedPromotions ?? [])
    const live = sortPromotions(filterPromotions(source, { availableOnly: true }, now), 'ending_soon')
    return withDistance(live, location)
  }, [bundled, fetchedPromotions, now, location])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-48 rounded-4xl sm:h-64" />
        <Skeleton className="mt-6 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
        <CardGridSkeleton className="mt-10" count={3} />
      </div>
    )
  }

  if (error || !shop) {
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

  const distance = location
    ? formatDistance(
        haversineKm(location, { latitude: shop.latitude, longitude: shop.longitude })
      )
    : null

  const hours = shop.openingHours
  const hoursText =
    typeof hours === 'string'
      ? hours
      : hours
        ? Object.entries(hours)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' · ')
        : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-200 to-brand-400 ring-1 ring-line/80">
        {shop.coverImageUrl ? (
          <img
            src={shop.coverImageUrl}
            alt=""
            className="h-44 w-full object-cover sm:h-64"
            loading="lazy"
          />
        ) : (
          <div className="h-44 w-full sm:h-64" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 pt-16" />
        <Link
          to="/app/browse"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full glass px-3 py-2 text-sm font-semibold text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Link>
      </div>

      <div className="relative -mt-14 px-2 sm:px-6">
        <div className="flex flex-wrap items-end gap-4 rounded-4xl bg-surface p-5 ring-1 ring-line/80 shadow-card sm:p-6">
          {shop.profileImageUrl ? (
            <img
              src={shop.profileImageUrl}
              alt=""
              className="size-20 rounded-3xl object-cover ring-4 ring-surface sm:size-24"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-3xl bg-brand-100 font-display text-2xl font-extrabold text-brand-700 ring-4 ring-surface sm:size-24">
              {initials(shop.name) || <Store className="size-8" />}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {shop.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {(shop.categories ?? []).map((slugOrName) => {
                const category = CATEGORY_BY_SLUG[slugOrName]
                return (
                  <Badge key={slugOrName} tone="brand">
                    {category ? `${category.emoji} ${category.name}` : slugOrName}
                  </Badge>
                )
              })}
              {distance ? <Badge tone="neutral" icon={MapPin}>{distance} away</Badge> : null}
            </div>
          </div>

          <FavoriteButton shop={shop} showLabel />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Live promotions ({promotions.length})
          </h2>
          <div className="mt-5">
            {promotions.length ? (
              <PromoGrid
                promotions={promotions}
                onReserve={openReserve}
                now={now}
                className="sm:grid-cols-2"
              />
            ) : (
              <EmptyState
                icon={PackageOpen}
                title="No live promotions from this shop"
                description="Save the shop and we will email you the moment they post something new."
                action={<FavoriteButton shop={shop} showLabel />}
              />
            )}
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl bg-surface p-5 ring-1 ring-line/80 shadow-card">
          <h2 className="font-display text-base font-bold text-ink">About</h2>
          {shop.description ? (
            <p className="text-sm leading-relaxed text-muted">{shop.description}</p>
          ) : null}

          <div className="space-y-3 border-t border-line pt-4 text-sm">
            {shop.address ? (
              <p className="flex items-start gap-2.5 text-muted">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                <span>
                  {shop.address}
                  {shop.city ? `, ${shop.city}` : ''}
                </span>
              </p>
            ) : null}
            {hoursText ? (
              <p className="flex items-start gap-2.5 text-muted">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                {hoursText}
              </p>
            ) : null}
            {shop.contactPhone ? (
              <a
                href={`tel:${shop.contactPhone}`}
                className="flex items-start gap-2.5 text-muted transition hover:text-ink"
              >
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                {shop.contactPhone}
              </a>
            ) : null}
            {shop.contactEmail ? (
              <a
                href={`mailto:${shop.contactEmail}`}
                className="flex items-start gap-2.5 break-all text-muted transition hover:text-ink"
              >
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                {shop.contactEmail}
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
