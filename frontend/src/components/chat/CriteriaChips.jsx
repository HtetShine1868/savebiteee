import { Filter } from 'lucide-react'
import { formatPrice } from '../../lib/format.js'

const LABELS = {
  productName: (value) => `“${value}”`,
  category: (value) => `Category: ${value}`,
  maxPrice: (value) => `Under ${formatPrice(value)}`,
  minPrice: (value) => `Over ${formatPrice(value)}`,
  location: (value) => (value === 'near_me' ? 'Near me' : `In ${value}`),
  radius: (value) => `Within ${value} km`,
  availableNow: (value) => (value ? 'Available now' : null),
  endingSoon: (value) => (value ? 'Ending soon' : null),
  sortBy: (value) => `Sorted by ${String(value).replace(/_/g, ' ')}`,
  shopName: (value) => `Shop: ${value}`,
  favoritesOnly: (value) => (value ? 'Favourite shops' : null),
}

/**
 * Shows what the AI understood before the results. Makes the "Gemini extracts
 * criteria, the database answers" architecture visible instead of magic.
 */
export function CriteriaChips({ criteria }) {
  if (!criteria) return null

  const chips = Object.entries(criteria)
    .filter(([key, value]) => value != null && value !== '' && key !== 'intent' && LABELS[key])
    .map(([key, value]) => LABELS[key](value))
    .filter(Boolean)

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide text-spark-600 uppercase">
        <Filter className="size-3" aria-hidden="true" />
        Understood as
      </span>
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full bg-spark-100 px-2 py-0.5 text-[11px] font-semibold text-spark-700"
        >
          {chip}
        </span>
      ))}
    </div>
  )
}
