import { PromoCard } from './PromoCard.jsx'
import { cn } from '../../lib/cn.js'

export function PromoGrid({ promotions = [], onReserve, now, className }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {promotions.map((promotion, index) => (
        <PromoCard
          key={promotion.id}
          promotion={promotion}
          onReserve={onReserve}
          now={now}
          index={index}
        />
      ))}
    </div>
  )
}
