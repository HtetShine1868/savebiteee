/**
 * Every API call the frontend makes lives here, so swapping or renaming an
 * endpoint is a one-file change. The routes below match backend/src/routes/*.
 */

import { api, buildQuery } from './api.js'
import {
  normalizePromotion,
  normalizeReservation,
  normalizeShop,
  normalizeUser,
  serializePromotion,
  serializeShop,
  unwrapItem,
  unwrapList,
} from './normalize.js'

/** The API caps page size at 50. */
const MAX_LIMIT = 50

const SORT_MAP = {
  ending_soon: 'ending_soon',
  price_asc: 'lowest_price',
  lowest_price: 'lowest_price',
  newest: 'newest',
}

/**
 * Translates the UI's filter state into the query the API expects.
 *
 * Coordinates are only sent when the visitor actually filters by distance:
 * the nearby search skips shops that have no coordinates yet, and distance
 * labels are calculated in the browser anyway.
 */
function promotionQuery(params = {}) {
  const wantsRadius = params.radiusKm != null && params.radiusKm !== ''
  const latitude = params.latitude ?? params.lat
  const longitude = params.longitude ?? params.lng
  const hasLocation = latitude != null && longitude != null

  return {
    q: params.q ?? params.query,
    category: params.category,
    city: params.city,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    endingSoon: params.endingSoon ? 'true' : undefined,
    shopId: params.shopId,
    sort: SORT_MAP[params.sort ?? params.sortBy],
    status: params.status ?? (params.availableOnly ? 'active' : undefined),
    latitude: wantsRadius && hasLocation ? latitude : undefined,
    longitude: wantsRadius && hasLocation ? longitude : undefined,
    radiusKm: wantsRadius && hasLocation ? params.radiusKm : undefined,
    limit: params.limit == null ? undefined : Math.min(Number(params.limit), MAX_LIMIT),
    offset: params.offset,
  }
}

export const healthService = {
  check: (signal) => api.get('/api/health', { signal, auth: false }),
}

export const authService = {
  async register(payload) {
    const data = await api.post('/api/auth/register', payload, { auth: false })
    return { token: data?.token ?? null, user: normalizeUser(data) }
  },
  async login(payload) {
    const data = await api.post('/api/auth/login', payload, { auth: false })
    return { token: data?.token ?? null, user: normalizeUser(data) }
  },
  async loginWithGoogle(payload) {
    const data = await api.post('/api/auth/google', payload, { auth: false })
    return { token: data?.token ?? null, user: normalizeUser(data) }
  },
  async me(signal) {
    const data = await api.get('/api/auth/me', { signal })
    return normalizeUser(data)
  },
  async updateProfile(patch) {
    const data = await api.patch('/api/auth/me', patch)
    return normalizeUser(data)
  },
  logout: () => api.post('/api/auth/logout').catch(() => null),
}

export const categoryService = {
  async list(signal) {
    const data = await api.get('/api/categories', { signal, auth: false })
    return unwrapList(data, 'categories')
  },
}

export const promotionService = {
  async list(params = {}, signal) {
    const data = await api.get(`/api/promotions${buildQuery(promotionQuery(params))}`, {
      signal,
      auth: false,
    })
    return unwrapList(data, 'promotions').map(normalizePromotion)
  },
  async get(id, signal) {
    const data = await api.get(`/api/promotions/${id}`, { signal, auth: false })
    return normalizePromotion(unwrapItem(data, 'promotion'))
  },
  async listForOwner(params = {}, signal) {
    const data = await api.get(
      `/api/owner/promotions${buildQuery({ shopId: params.shopId })}`,
      { signal }
    )
    return unwrapList(data, 'promotions').map(normalizePromotion)
  },
  async create(form) {
    const data = await api.post('/api/owner/promotions', serializePromotion(form))
    return normalizePromotion(unwrapItem(data, 'promotion'))
  },
  async update(id, form) {
    const payload = serializePromotion(form)
    delete payload.shopId
    const data = await api.patch(`/api/owner/promotions/${id}`, payload)
    return normalizePromotion(unwrapItem(data, 'promotion'))
  },
  remove: (id) => api.delete(`/api/owner/promotions/${id}`),
}

export const shopService = {
  /** Public shop page: returns the shop plus its live promotions in one call. */
  async get(id, signal) {
    const data = await api.get(`/api/shops/${id}`, { signal, auth: false })
    return {
      shop: normalizeShop(unwrapItem(data, 'shop')),
      promotions: unwrapList(data, 'promotions').map(normalizePromotion),
    }
  },
  async mine(signal) {
    const data = await api.get('/api/owner/shops', { signal })
    const [first] = unwrapList(data, 'shops')
    return first ? normalizeShop(first) : null
  },
  async save(id, form) {
    const payload = serializeShop(form)
    const data = id
      ? await api.patch(`/api/owner/shops/${id}`, payload)
      : await api.post('/api/owner/shops', payload)
    return normalizeShop(unwrapItem(data, 'shop'))
  },
}

export const favoriteService = {
  async list(signal) {
    const data = await api.get('/api/favorites', { signal })
    return unwrapList(data, 'favorites')
      .map((entry) => normalizeShop(entry?.shop ?? entry))
      .filter(Boolean)
  },
  add: (shopId) => api.post(`/api/favorites/${shopId}`),
  remove: (shopId) => api.delete(`/api/favorites/${shopId}`),
}

export const reservationService = {
  async mine(signal) {
    const data = await api.get('/api/reservations/me', { signal })
    return unwrapList(data, 'reservations').map(normalizeReservation)
  },
  async create({ promotionId, quantity }) {
    const data = await api.post('/api/reservations', { promotionId, quantity: Number(quantity) })
    return normalizeReservation(unwrapItem(data, 'reservation'))
  },
  async cancel(id) {
    const data = await api.post(`/api/reservations/${id}/cancel`)
    return normalizeReservation(unwrapItem(data, 'reservation'))
  },
  async forOwner(params = {}, signal) {
    const data = await api.get(
      `/api/owner/reservations${buildQuery({ status: params.status })}`,
      { signal }
    )
    return unwrapList(data, 'reservations').map(normalizeReservation)
  },
  /** Owner-side transitions: picked_up, cancelled or expired. */
  async updateStatus(id, status) {
    const data = await api.patch(`/api/owner/reservations/${id}`, { status })
    return normalizeReservation(unwrapItem(data, 'reservation'))
  },
}

export const chatService = {
  /**
   * The backend asks Gemini for the search criteria, queries the database, and
   * returns a message plus the real matching promotions. The frontend never
   * talks to Gemini directly.
   */
  async send({ message, history = [], location = null, radiusKm, city }, signal) {
    const data = await api.post(
      '/api/chat',
      {
        message,
        history: history
          .filter((entry) => entry.content?.trim())
          .slice(-8)
          .map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
        ...(location
          ? { latitude: location.latitude, longitude: location.longitude }
          : {}),
        ...(location && radiusKm ? { radiusKm } : {}),
        ...(city ? { city } : {}),
      },
      { signal }
    )
    return {
      message: data?.reply ?? data?.message ?? '',
      criteria: data?.criteria ?? null,
      promotions: unwrapList(data, 'promotions').map(normalizePromotion),
    }
  },
}

export const statsService = {
  async impact(signal) {
    const data = await api.get('/api/stats/impact', { signal, auth: false })
    return unwrapItem(data, 'stats')
  },
}
