const CATEGORY_ALIASES = {
  bakery: ['bakery', 'bread', 'pastry', 'cake', 'croissant', 'donut', 'bun'],
  pizza: ['pizza', 'pizzas'],
  asian: ['asian', 'chinese', 'thai', 'japanese', 'korean', 'noodles', 'rice'],
  drinks: ['drink', 'drinks', 'coffee', 'tea', 'juice', 'beverage'],
  groceries: ['grocery', 'groceries', 'supermarket', 'produce'],
  desserts: ['dessert', 'desserts', 'sweet', 'ice cream', 'cookie'],
  vegetarian: ['vegetarian', 'vegan', 'veggie', 'plant-based'],
}

const CITY_ALIASES = ['yangon', 'mandalay', 'naypyidaw', 'bago', 'taunggyi']

function findCategory(text) {
  for (const [slug, words] of Object.entries(CATEGORY_ALIASES)) {
    if (words.some((word) => text.includes(word))) {
      return slug
    }
  }
  return null
}

function findCity(text) {
  return CITY_ALIASES.find((city) => text.includes(city)) || null
}

function findPrice(text) {
  const match = text.match(/(?:under|below|less than|cheaper than|max(?:imum)?)\s*([\d,]+)/i)
    || text.match(/([\d,]+)\s*(?:mmk|ks|kyat)/i)

  if (!match) return null
  return Number(match[1].replace(/,/g, ''))
}

function findRadius(text) {
  const match = text.match(/(?:within|under|inside)\s*(\d+(?:\.\d+)?)\s*km\b/i)
  return match ? Number(match[1]) : null
}

export function fallbackExtractCriteria(message) {
  const text = String(message || '').toLowerCase()
  const category = findCategory(text)
  const city = findCity(text)
  const maxPrice = findPrice(text)
  const cheap = /\b(cheap|affordable|budget|discount|promo)\b/.test(text)
  const endingSoon = /\b(ending soon|expire|last chance|hurry)\b/.test(text)
  const nearMe = /\b(near me|nearby|around me|close to me)\b/.test(text)
  const favoriteShops = /\b(my favorites?|favorite shops?|favourite shops?)\b/.test(text)

  let product = null
  if (category === 'pizza' && /\bpizza/.test(text)) product = 'pizza'
  if (!product) {
    const named = text.match(/\b(pizza|bread|cake|coffee|noodles|rice|burger|sandwich)\b/)
    product = named ? named[1] : null
  }

  return {
    intent: 'search_promotions',
    product,
    category,
    location: city,
    nearMe,
    radiusKm: findRadius(text),
    minPrice: null,
    maxPrice,
    availableNow: !/\b(upcoming|later|tomorrow)\b/.test(text),
    endingSoon,
    sortBy: cheap || maxPrice ? 'lowest_price' : endingSoon ? 'ending_soon' : null,
    shopPreference: favoriteShops ? 'favorites' : null,
    vegetarian: category === 'vegetarian' || /\b(vegetarian|vegan)\b/.test(text),
  }
}

export function criteriaToSearchParams(criteria, context = {}) {
  const hasCoordinates =
    criteria.nearMe && context.latitude != null && context.longitude != null
  const city = criteria.nearMe
    ? criteria.location || (hasCoordinates ? null : context.city) || null
    : criteria.location || null

  const q = [criteria.product, criteria.vegetarian ? 'vegetarian' : null]
    .filter(Boolean)
    .join(' ')
    .trim()

  return {
    q: q || undefined,
    category: criteria.category || undefined,
    city: city || undefined,
    ...(hasCoordinates
      ? {
          latitude: context.latitude,
          longitude: context.longitude,
          radiusKm: criteria.radiusKm || context.radiusKm,
        }
      : {}),
    ...(criteria.shopPreference === 'favorites'
      ? { shopIds: context.favoriteShopIds || [] }
      : {}),
    minPrice: criteria.minPrice ?? undefined,
    maxPrice: criteria.maxPrice ?? undefined,
    endingSoon: criteria.endingSoon ? 'true' : undefined,
    status: criteria.availableNow === false ? undefined : 'active',
    sort: criteria.sortBy || 'ending_soon',
    limit: 8,
    offset: 0,
  }
}

export function emptyCriteria() {
  return {
    intent: 'search_promotions',
    product: null,
    category: null,
    location: null,
    nearMe: false,
    radiusKm: null,
    minPrice: null,
    maxPrice: null,
    availableNow: true,
    endingSoon: false,
    sortBy: null,
    shopPreference: null,
    vegetarian: false,
  }
}
