/**
 * Every API call the frontend makes lives here, so swapping or renaming an
 * endpoint is a one-file change. The expected request/response shapes are
 * documented in API_CONTRACT.md.
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
    const data = await api.get(`/api/promotions${buildQuery(params)}`, { signal, auth: false })
    return unwrapList(data, 'promotions').map(normalizePromotion)
  },
  async get(id, signal) {
    const data = await api.get(`/api/promotions/${id}`, { signal, auth: false })
    return normalizePromotion(unwrapItem(data, 'promotion'))
  },
  async listForOwner(params = {}, signal) {
    const data = await api.get(`/api/owner/promotions${buildQuery(params)}`, { signal })
    return unwrapList(data, 'promotions').map(normalizePromotion)
  },
  async create(form) {
    const data = await api.post('/api/promotions', serializePromotion(form))
    return normalizePromotion(unwrapItem(data, 'promotion'))
  },
  async update(id, form) {
    const data = await api.patch(`/api/promotions/${id}`, serializePromotion(form))
    return normalizePromotion(unwrapItem(data, 'promotion'))
  },
  remove: (id) => api.delete(`/api/promotions/${id}`),
}

export const shopService = {
  async list(params = {}, signal) {
    const data = await api.get(`/api/shops${buildQuery(params)}`, { signal, auth: false })
    return unwrapList(data, 'shops').map(normalizeShop)
  },
  async getBySlug(slug, signal) {
    const data = await api.get(`/api/shops/${slug}`, { signal, auth: false })
    const shop = normalizeShop(unwrapItem(data, 'shop'))
    const promotions = unwrapList(data, 'promotions').map(normalizePromotion)
    return { shop, promotions }
  },
  async mine(signal) {
    const data = await api.get('/api/owner/shop', { signal })
    return normalizeShop(unwrapItem(data, 'shop'))
  },
  async save(form) {
    const data = await api.put('/api/owner/shop', serializeShop(form))
    return normalizeShop(unwrapItem(data, 'shop'))
  },
}

export const favoriteService = {
  async list(signal) {
    const data = await api.get('/api/favorites', { signal })
    const shops = unwrapList(data, 'shops', 'favorites')
    return shops.map((entry) =>
      typeof entry === 'string' ? { id: entry } : normalizeShop(entry.shop ?? entry)
    )
  },
  add: (shopId) => api.post(`/api/favorites/${shopId}`),
  remove: (shopId) => api.delete(`/api/favorites/${shopId}`),
}

export const reservationService = {
  async mine(signal) {
    const data = await api.get('/api/reservations', { signal })
    return unwrapList(data, 'reservations').map(normalizeReservation)
  },
  async create({ promotionId, quantity, note }) {
    const data = await api.post('/api/reservations', {
      promotion_id: promotionId,
      quantity,
      note: note || null,
    })
    return normalizeReservation(unwrapItem(data, 'reservation'))
  },
  async updateStatus(id, status) {
    const data = await api.patch(`/api/reservations/${id}`, { status })
    return normalizeReservation(unwrapItem(data, 'reservation'))
  },
  cancel(id) {
    return this.updateStatus(id, 'cancelled')
  },
  async forOwner(params = {}, signal) {
    const data = await api.get(`/api/owner/reservations${buildQuery(params)}`, { signal })
    return unwrapList(data, 'reservations').map(normalizeReservation)
  },
}

export const chatService = {
  /**
   * The backend asks Gemini for the search criteria, queries the database, and
   * returns a message plus the real matching promotions. The frontend never
   * talks to Gemini directly.
   */
  async send({ message, history = [], userLocation = null }, signal) {
    const data = await api.post(
      '/api/chat',
      {
        message,
        history: history.slice(-8).map(({ role, content }) => ({ role, content })),
        userLocation,
      },
      { signal }
    )
    return {
      message: data?.message ?? data?.reply ?? '',
      criteria: data?.criteria ?? data?.filters ?? null,
      promotions: unwrapList(data, 'promotions', 'products').map(normalizePromotion),
    }
  },
}

export const statsService = {
  async impact(signal) {
    const data = await api.get('/api/stats/impact', { signal, auth: false })
    return unwrapItem(data, 'stats')
  },
  async owner(signal) {
    const data = await api.get('/api/owner/stats', { signal })
    return unwrapItem(data, 'stats')
  },
}
