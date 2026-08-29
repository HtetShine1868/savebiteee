import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { PromoCard } from './PromoCard.jsx'
import { IconButton } from '../ui/Button.jsx'
import { PromoCardSkeleton } from '../ui/Feedback.jsx'
import { cn } from '../../lib/cn.js'

export function PromoRail({
  title,
  emoji,
  description,
  promotions = [],
  loading = false,
  seeAllHref,
  onReserve,
  now,
  className,
}) {
  const scroller = useRef(null)

  const scrollBy = (direction) => {
    const node = scroller.current
    if (!node) return
    node.scrollBy({ left: direction * Math.min(node.clientWidth * 0.8, 640), behavior: 'smooth' })
  }

  if (!loading && promotions.length === 0) return null

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
            {emoji ? (
              <span aria-hidden="true" className="text-2xl">
                {emoji}
              </span>
            ) : null}
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {seeAllHref ? (
            <Link
              to={seeAllHref}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              See all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
          <div className="hidden items-center gap-1.5 sm:flex">
            <IconButton
              size="sm"
              label="Scroll left"
              icon={ChevronLeft}
              onClick={() => scrollBy(-1)}
            />
            <IconButton
              size="sm"
              label="Scroll right"
              icon={ChevronRight}
              onClick={() => scrollBy(1)}
            />
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="w-[78%] shrink-0 snap-start sm:w-72">
                <PromoCardSkeleton />
              </div>
            ))
          : promotions.map((promotion, index) => (
              <div key={promotion.id} className="w-[78%] shrink-0 snap-start sm:w-72">
                <PromoCard promotion={promotion} onReserve={onReserve} now={now} index={index} />
              </div>
            ))}
      </div>
    </section>
  )
}
