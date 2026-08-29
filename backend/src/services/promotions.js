import { supabase } from '../config/supabase.js'
import { AppError, unwrap } from '../lib/errors.js'
import { parsePagination } from '../lib/pagination.js'

export function applyPromotionFilters(query, params) {
  const {
    q,
    category,
    shopId,
    shopIds,
    categoryIds,
    city,
    minPrice,
    maxPrice,
    endingSoon,
    status,
  } = params

  if (status) {
    query = query.eq('status', status)
  }

  if (shopId) {
    query = query.eq('shop_id', shopId)
  }

  if (shopIds?.length) {
    query = query.in('shop_id', shopIds)
  }

  if (categoryIds?.length) {
    query = query.in('category_id', categoryIds)
  }

  if (category) {
    query = query.eq('category_slug', category)
  }

  if (city) {
    query = query.ilike('shop_city', `%${city}%`)
  }

  if (minPrice !== undefined && minPrice !== '') {
    query = query.gte('promo_price', Number(minPrice))
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    query = query.lte('promo_price', Number(maxPrice))
  }

  if (endingSoon === 'true' || endingSoon === true) {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    query = query.lte('ends_at', soon)
  }

  if (q) {
    const term = q.replace(/[%(),]/g, ' ').trim()
    if (term) {
      query = query.or(
        `product_name.ilike.%${term}%,shop_name.ilike.%${term}%,category_name.ilike.%${term}%`
      )
    }
  }

  return query
}

export function parseLocationParams(params = {}) {
  const hasLatitude =
    params.latitude !== undefined && params.latitude !== null && params.latitude !== ''
  const hasLongitude =
    params.longitude !== undefined && params.longitude !== null && params.longitude !== ''

  if (hasLatitude !== hasLongitude) {
    throw new AppError(
      400,
      'Latitude and longitude must be provided together',
      'INVALID_LOCATION'
    )
  }

  if (!hasLatitude) return null

  const latitude = Number(params.latitude)
  const longitude = Number(params.longitude)
  const configuredDefault = Number(process.env.DEFAULT_RADIUS_KM) || 10
  const configuredMax = Number(process.env.MAX_RADIUS_KM) || 50
  const radiusKm = params.radiusKm === undefined || params.radiusKm === ''
    ? configuredDefault
    : Number(params.radiusKm)

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new AppError(400, 'Latitude must be between -90 and 90', 'INVALID_LOCATION')
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError(400, 'Longitude must be between -180 and 180', 'INVALID_LOCATION')
  }
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > configuredMax) {
    throw new AppError(
      400,
      `Radius must be greater than 0 and at most ${configuredMax} km`,
      'INVALID_RADIUS'
    )
  }

  return { latitude, longitude, radiusKm }
}

function applySort(query, sort) {
  if (sort === 'lowest_price') {
    return query.order('promo_price', { ascending: true })
  }

  if (sort === 'newest') {
    return query.order('created_at', { ascending: false })
  }

  return query.order('ends_at', { ascending: true })
}

export async function searchPromotions(params) {
  const { limit, offset } = parsePagination(params)
  const status = params.status || 'active'
  const location = parseLocationParams(params)

  if (Array.isArray(params.shopIds) && !params.shopIds.length) {
    return { rows: [], count: 0, limit, offset }
  }

  if (location && status === 'active') {
    const term = params.q?.replace(/[%(),]/g, ' ').trim() || null
    const result = await supabase.rpc('search_promotions_nearby', {
      p_latitude: location.latitude,
      p_longitude: location.longitude,
      p_radius_km: location.radiusKm,
      p_query: term,
      p_category: params.category || null,
      p_city: params.city || null,
      p_min_price:
        params.minPrice !== undefined && params.minPrice !== ''
          ? Number(params.minPrice)
          : null,
      p_max_price:
        params.maxPrice !== undefined && params.maxPrice !== ''
          ? Number(params.maxPrice)
          : null,
      p_ending_soon: params.endingSoon === 'true' || params.endingSoon === true,
      p_shop_ids: params.shopIds?.length ? params.shopIds : null,
      p_category_ids: params.categoryIds?.length ? params.categoryIds : null,
      p_limit: limit,
      p_offset: offset,
    })

    const rows = unwrap(result) || []
    return {
      rows,
      count: Number(rows[0]?.full_count || 0),
      limit,
      offset,
    }
  }

  let query = supabase
    .from('promotion_listings')
    .select('*', { count: 'exact' })

  query = applyPromotionFilters(query, { ...params, status })
  query = applySort(query, params.sort)
  query = query.range(offset, offset + limit - 1)

  const result = await query
  const rows = unwrap(result)

  return {
    rows,
    count: result.count || 0,
    limit,
    offset,
  }
}

export async function getFavoriteShopIds(userId) {
  if (!userId) return []

  const rows = unwrap(
    await supabase.from('shop_favorites').select('shop_id').eq('user_id', userId)
  ) || []

  return rows.map((row) => row.shop_id)
}

export function rankPersonalizedRows(favoriteRows, categoryRows, { limit, offset }) {
  const seen = new Set()
  const ranked = [...favoriteRows, ...categoryRows].filter((row) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })

  return {
    rows: ranked.slice(offset, offset + limit),
    count: ranked.length,
  }
}

export async function getPersonalizedPromotions(userId, params = {}) {
  const { limit, offset } = parsePagination(params)
  const favoriteIds = await getFavoriteShopIds(userId)
  const reservationRows = unwrap(
    await supabase
      .from('reservations')
      .select('promotion:promotions(category_id)')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
  ) || []
  const categoryIds = [
    ...new Set(
      reservationRows
        .map((row) => row.promotion?.category_id)
        .filter(Boolean)
    ),
  ]

  const fetchLimit = Math.min(limit + offset, 50)
  const [favoriteResult, categoryResult] = await Promise.all([
    favoriteIds.length
      ? searchPromotions({ ...params, shopIds: favoriteIds, limit: fetchLimit, offset: 0 })
      : Promise.resolve({ rows: [] }),
    categoryIds.length
      ? searchPromotions({ ...params, categoryIds, limit: fetchLimit, offset: 0 })
      : Promise.resolve({ rows: [] }),
  ])

  const ranked = rankPersonalizedRows(
    favoriteResult.rows,
    categoryResult.rows,
    { limit, offset }
  )

  return {
    rows: ranked.rows,
    count: ranked.count,
    limit,
    offset,
  }
}

export async function getPromotionListing(id) {
  const result = await supabase
    .from('promotion_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return unwrap(result, 'Promotion not found')
}

export async function getListingsByIds(ids) {
  if (!ids.length) return {}

  const result = await supabase.from('promotion_listings').select('*').in('id', ids)
  const rows = unwrap(result) || []

  return Object.fromEntries(rows.map((row) => [row.id, row]))
}

export async function listDashboard(params = {}) {
  const limit = 8

  const [available, ending, categories] = await Promise.all([
    supabase
      .from('promotion_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('promotion_listings')
      .select('*')
      .eq('status', 'active')
      .order('ends_at', { ascending: true })
      .limit(limit),
    supabase.from('categories').select('*').order('name'),
  ])

  const availableRows = unwrap(available) || []
  const endingRows = unwrap(ending) || []
  const categoryRows = unwrap(categories) || []

  const byCategoryEntries = await Promise.all(
    categoryRows.map(async (category) => {
      const result = await supabase
        .from('promotion_listings')
        .select('*')
        .eq('status', 'active')
        .eq('category_slug', category.slug)
        .order('ends_at', { ascending: true })
        .limit(6)

      return [category.slug, unwrap(result) || []]
    })
  )

  const userId = params.userId
  const location = parseLocationParams(params)
  const [personalized, nearby] = await Promise.all([
    userId
      ? getPersonalizedPromotions(userId, { limit, offset: 0 })
      : Promise.resolve({ rows: [] }),
    location
      ? searchPromotions({
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm: location.radiusKm,
          limit,
          offset: 0,
        })
      : Promise.resolve({ rows: [] }),
  ])

  const favoriteIds = userId ? await getFavoriteShopIds(userId) : []
  const fromFavoriteShops = favoriteIds.length
    ? await searchPromotions({ shopIds: favoriteIds, limit, offset: 0 })
    : { rows: [] }

  return {
    availableNow: availableRows,
    endingSoon: endingRows,
    categories: categoryRows,
    byCategory: Object.fromEntries(
      byCategoryEntries.filter(([, items]) => items.length > 0)
    ),
    personalized: personalized.rows,
    fromFavoriteShops: fromFavoriteShops.rows,
    nearby: nearby.rows,
  }
}
