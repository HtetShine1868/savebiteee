/**
 * HTTP client for the Food Waste Solver API.
 *
 * Base URL comes from VITE_API_URL. Left empty, requests go to /api/* and the
 * Vite dev proxy forwards them to the Express server (see vite.config.js).
 */

const RAW_BASE = import.meta.env.VITE_API_URL ?? ''
export const API_BASE = RAW_BASE.replace(/\/+$/, '')

const TOKEN_KEY = 'fws.token'

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable — the token still lives in memory for this session */
  }
}

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status ?? 0
    this.code = code
    this.details = details
  }

  /** No server reachable at all. */
  get isOffline() {
    return this.status === 0
  }

  /** Route not built yet (or removed) — the UI shows a "waiting on API" state. */
  get isMissing() {
    return this.status === 404 || this.status === 501
  }

  get isAuth() {
    return this.status === 401 || this.status === 403
  }
}

export async function apiRequest(path, { method = 'GET', body, signal, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getAuthToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      signal,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the server. Is the API running?', { code: 'NETWORK' })
  }

  if (response.status === 204) return null

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { error: text }
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.error || payload?.message || `Request failed (${response.status})`, {
      status: response.status,
      code: payload?.code,
      details: payload?.details,
    })
  }

  return payload
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue
    search.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
