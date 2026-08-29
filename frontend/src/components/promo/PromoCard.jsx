import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, MapPin, Package, Store } from 'lucide-react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { FavoriteButton } from './FavoriteButton.jsx'
import { FoodImage } from './FoodImage.jsx'
import { cn } from '../../lib/cn.js'
import { discountPercent, formatDistance, formatPrice, timeLeft } from '../../lib/format.js'
import { STATUS_META, computeStatus } from '../../lib/promotions.js'

function StockMeter({ quantity }) {
  const scarce = quantity <= 3
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold">
      <Package className={cn('size-3.5', scarce ? 'text-flash-600' : 'text-muted')} />
      <span className={scarce ? 'text-flash-700' : 'text-muted'}>
        {quantity > 0 ? `${quantity} left` : 'Sold out'}
      </span>
    </div>
  )
}

export function PromoCard({ promotion, now, onReserve, index = 0 }) {
  if (!promotion) return null

  const status = promotion.status ?? computeStatus(promotion, now)
  const statusMeta = STATUS_META[status] ?? STATUS_META.active
  const countdown = timeLeft(promotion.endsAt, now)
  const discount = discountPercent(promotion.originalPrice, promotion.promoPrice)
  const distance = formatDistance(promotion.distanceKm)
  const reservable = status === 'active'
  const detailHref = `/app/promotions/${promotion.id}`

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-line/80 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200"
    >
      <div className="relative">
        <FoodImage
          src={promotion.imageUrl}
          alt={promotion.productName}
          category={promotion.category}
          className="aspect-[4/3] w-full"
        />

        <Link
          to={detailHref}
          className="absolute inset-0"
          aria-label={`View ${promotion.productName}`}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-col items-start gap-2">
            {discount > 0 ? (
              <span className="rounded-full bg-flash-500 px-2.5 py-1 font-display text-xs font-extrabold text-white shadow-sm">
                -{discount}%
              </span>
            ) : null}
            {status !== 'active' ? <Badge tone="inverse">{statusMeta.label}</Badge> : null}
          </div>
          {promotion.shop ? (
            <div className="pointer-events-auto">
              <FavoriteButton shop={promotion.shop} size="sm" />
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent p-3 pt-10">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
              countdown.expired
                ? 'bg-white/90 text-muted'
                : countdown.urgent
                  ? 'bg-flash-500 text-white'
                  : 'bg-white/95 text-ink'
            )}
          >
            <Clock className="size-3.5" aria-hidden="true" />
            {countdown.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <span aria-hidden="true">{promotion.category?.emoji}</span>
            <span className="truncate">{promotion.category?.name}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 font-display text-base leading-snug font-bold text-ink">
            <Link to={detailHref} className="hover:text-brand-700">
              {promotion.productName}
            </Link>
          </h3>
        </div>

        {promotion.shop ? (
          <Link
            to={`/app/shops/${promotion.shop.slug}`}
            className="flex min-w-0 items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <Store className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">{promotion.shop.name}</span>
          </Link>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold tracking-tight text-brand-700">
              {formatPrice(promotion.promoPrice)}
            </p>
            {discount > 0 ? (
              <p className="text-xs text-muted line-through">{formatPrice(promotion.originalPrice)}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1">
            <StockMeter quantity={promotion.quantityAvailable} />
            {distance || promotion.shop?.city ? (
              <span className="flex items-center gap-1 text-xs text-muted">
                <MapPin className="size-3.5" aria-hidden="true" />
                {distance ?? promotion.shop.city}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button as={Link} to={detailHref} variant="secondary" size="sm" className="flex-1">
            View details
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={!reservable}
            onClick={() => onReserve?.(promotion)}
          >
            {reservable ? 'Reserve' : statusMeta.label}
          </Button>
        </div>
      </div>
    </motion.article>
  )
}

/** Condensed card used inside chat answers and tight sidebars. */
export function PromoCardCompact({ promotion, now, onReserve }) {
  if (!promotion) return null
  const countdown = timeLeft(promotion.endsAt, now)
  const discount = discountPercent(promotion.originalPrice, promotion.promoPrice)

  return (
    <article className="group flex gap-3 rounded-2xl bg-surface p-2.5 ring-1 ring-line/80 transition hover:ring-brand-200">
      <Link to={`/app/promotions/${promotion.id}`} className="shrink-0">
        <FoodImage
          src={promotion.imageUrl}
          alt={promotion.productName}
          category={promotion.category}
          className="size-20 rounded-xl"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-ink">
            <Link to={`/app/promotions/${promotion.id}`} className="hover:text-brand-700">
              {promotion.productName}
            </Link>
          </h4>
          <p className="truncate text-xs text-muted">{promotion.shop?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-extrabold text-brand-700">
            {formatPrice(promotion.promoPrice)}
          </span>
          {discount > 0 ? (
            <span className="text-xs text-muted line-through">{formatPrice(promotion.originalPrice)}</span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-xs font-semibold',
              countdown.urgent ? 'text-flash-600' : 'text-muted'
            )}
          >
            {countdown.label} · {promotion.quantityAvailable} left
          </span>
          <Button size="xs" onClick={() => onReserve?.(promotion)} disabled={promotion.status !== 'active'}>
            Reserve
          </Button>
        </div>
      </div>
    </article>
  )
}
