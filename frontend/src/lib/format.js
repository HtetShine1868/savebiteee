const CURRENCY = 'MMK'

export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('en-US')} ${CURRENCY}`
}

export function formatCompactPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
  return String(n)
}

export function discountPercent(originalPrice, promoPrice) {
  const original = Number(originalPrice)
  const promo = Number(promoPrice)
  if (!original || original <= 0 || promo >= original) return 0
  return Math.round(((original - promo) / original) * 100)
}

export function formatClock(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDay(value) {
  if (!value) return '—'
  const date = new Date(value)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return 'Today'
  const tomorrow = new Date(today.getTime() + 86_400_000)
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return `${formatDay(value)}, ${formatClock(value)}`
}

/**
 * Human countdown to a timestamp.
 * `urgent` drives the amber "ending soon" treatment across the UI.
 */
export function timeLeft(endsAt, now = Date.now()) {
  if (!endsAt) return { ms: 0, label: '—', expired: true, urgent: false }
  const ms = new Date(endsAt).getTime() - now
  if (ms <= 0) return { ms: 0, label: 'Ended', expired: true, urgent: false }

  const minutes = Math.floor(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let label
  if (days >= 1) label = `${days}d ${hours % 24}h left`
  else if (hours >= 1) label = `${hours}h ${String(minutes % 60).padStart(2, '0')}m left`
  else if (minutes >= 1) label = `${minutes}m left`
  else label = 'Under a minute'

  return { ms, label, expired: false, urgent: ms <= 2 * 60 * 60 * 1000 }
}

export function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(km < 10 ? 1 : 0)} km`
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** `datetime-local` inputs need a local ISO string without the timezone suffix. */
export function toLocalInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
