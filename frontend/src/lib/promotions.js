export const CATEGORIES = [
  { name: 'Bakery', slug: 'bakery', emoji: '🥐', tint: 'from-amber-200 to-orange-300' },
  { name: 'Pizza', slug: 'pizza', emoji: '🍕', tint: 'from-red-200 to-orange-300' },
  { name: 'Asian', slug: 'asian', emoji: '🍜', tint: 'from-rose-200 to-amber-200' },
  { name: 'Drinks', slug: 'drinks', emoji: '🥤', tint: 'from-sky-200 to-cyan-300' },
  { name: 'Groceries', slug: 'groceries', emoji: '🥦', tint: 'from-lime-200 to-emerald-300' },
  { name: 'Desserts', slug: 'desserts', emoji: '🍰', tint: 'from-pink-200 to-fuchsia-300' },
  { name: 'Vegetarian', slug: 'vegetarian', emoji: '🥗', tint: 'from-emerald-200 to-teal-300' },
  { name: 'Other', slug: 'other', emoji: '🍱', tint: 'from-stone-200 to-stone-300' },
]

export const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]))

export const STATUS_META = {
  active: { label: 'Available now', tone: 'brand' },
  upcoming: { label: 'Starts soon', tone: 'spark' },
  sold_out: { label: 'Sold out', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'danger' },
}

export const SORT_OPTIONS = [
  { value: 'ending_soon', label: 'Ending soonest' },
  { value: 'price_asc', label: 'Cheapest first' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'distance', label: 'Closest to me' },
  { value: 'newest', label: 'Newest' },
]

export function computeStatus(promotion, now = Date.now()) {
  if (!promotion) return 'expired'
  const starts = new Date(promotion.startsAt).getTime()
  const ends = new Date(promotion.endsAt).getTime()
  const foodExpires = promotion.foodExpiresAt ? new Date(promotion.foodExpiresAt).getTime() : null

  if (now > ends || (foodExpires && now > foodExpires)) return 'expired'
  if (promotion.quantityAvailable <= 0) return 'sold_out'
  if (now < starts) return 'upcoming'
  return 'active'
}

export function isReservable(promotion, now = Date.now()) {
  return computeStatus(promotion, now) === 'active'
}

/** Shown on customer surfaces: expired listings are never advertised as available. */
export function isDiscoverable(promotion, now = Date.now()) {
  const status = computeStatus(promotion, now)
  return status === 'active' || status === 'upcoming'
}

export function haversineKm(a, b) {
  if (!a || !b) return null
  const { latitude: lat1, longitude: lon1 } = a
  const { latitude: lat2, longitude: lon2 } = b
  if ([lat1, lon1, lat2, lon2].some((v) => v == null || Number.isNaN(Number(v)))) return null

  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function withDistance(promotions, userLocation) {
  if (!userLocation) return promotions.map((p) => ({ ...p, distanceKm: null }))
  return promotions.map((p) => ({
    ...p,
    distanceKm: haversineKm(userLocation, {
      latitude: p.shop?.latitude,
      longitude: p.shop?.longitude,
    }),
  }))
}

export function matchesText(promotion, rawQuery) {
  const query = rawQuery?.trim().toLowerCase()
  if (!query) return true
  const haystack = [
    promotion.productName,
    promotion.description,
    promotion.shop?.name,
    promotion.shop?.city,
    promotion.shop?.address,
    promotion.category?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return query.split(/\s+/).every((token) => haystack.includes(token))
}

export function filterPromotions(promotions, filters = {}, now = Date.now()) {
  const {
    query,
    categorySlugs = [],
    maxPrice,
    minPrice,
    endingSoon,
    availableOnly = true,
    city,
    maxDistanceKm,
    shopIds,
  } = filters

  return promotions.filter((promotion) => {
    const status = computeStatus(promotion, now)
    if (availableOnly ? status !== 'active' : status === 'expired') return false
    if (!matchesText(promotion, query)) return false
    if (categorySlugs.length && !categorySlugs.includes(promotion.category?.slug)) return false
    if (maxPrice != null && Number(promotion.promoPrice) > Number(maxPrice)) return false
    if (minPrice != null && Number(promotion.promoPrice) < Number(minPrice)) return false
    if (endingSoon) {
      const msLeft = new Date(promotion.endsAt).getTime() - now
      if (msLeft > 3 * 60 * 60 * 1000) return false
    }
    if (city && !promotion.shop?.city?.toLowerCase().includes(city.toLowerCase())) return false
    if (maxDistanceKm != null && promotion.distanceKm != null && promotion.distanceKm > maxDistanceKm) {
      return false
    }
    if (shopIds?.length && !shopIds.includes(promotion.shopId)) return false
    return true
  })
}

export function sortPromotions(promotions, sortBy = 'ending_soon') {
  const list = [...promotions]
  const byEnd = (a, b) => new Date(a.endsAt) - new Date(b.endsAt)

  switch (sortBy) {
    case 'price_asc':
      return list.sort((a, b) => a.promoPrice - b.promoPrice || byEnd(a, b))
    case 'price_desc':
      return list.sort((a, b) => b.promoPrice - a.promoPrice)
    case 'discount':
      return list.sort(
        (a, b) =>
          (b.originalPrice - b.promoPrice) / b.originalPrice -
          (a.originalPrice - a.promoPrice) / a.originalPrice
      )
    case 'distance':
      return list.sort((a, b) => {
        if (a.distanceKm == null) return 1
        if (b.distanceKm == null) return -1
        return a.distanceKm - b.distanceKm
      })
    case 'newest':
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    default:
      return list.sort(byEnd)
  }
}

export function mealsRescued(reservations) {
  return reservations
    .filter((r) => r.status === 'reserved' || r.status === 'picked_up')
    .reduce((total, r) => total + r.quantity, 0)
}

export function moneySaved(reservations) {
  return reservations
    .filter((r) => r.status === 'reserved' || r.status === 'picked_up')
    .reduce((total, r) => {
      const original = Number(r.promotion?.originalPrice ?? 0)
      const promo = Number(r.promotion?.promoPrice ?? 0)
      return total + Math.max(0, original - promo) * r.quantity
    }, 0)
}
