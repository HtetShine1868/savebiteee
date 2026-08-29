export function slugify(text) {
  const base = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base || 'shop'}-${suffix}`
}
