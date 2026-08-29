/**
 * Response mappers.
 *
 * The API may hand back rows straight from the `promotion_listings` view
 * (snake_case, flattened shop columns) or already-camelCased JSON. These
 * mappers accept either so components only ever deal with one shape.
 */

import { CATEGORY_BY_SLUG, computeStatus } from './promotions.js'

function pick(source, ...keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

const num = (value) => (value == null || value === '' ? null : Number(value))

/** Accepts `[...]`, `{ items: [...] }`, `{ data: [...] }` or a named collection. */
export function unwrapList(payload, ...keys) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  for (const key of [...keys, 'items', 'data', 'results']) {
    if (Array.isArray(payload[key])) return payload[key]
  }
  return []
}

export function unwrapItem(payload, ...keys) {
  if (!payload || typeof payload !== 'object') return null
  for (const key of [...keys, 'item', 'data']) {
    if (payload[key] && typeof payload[key] === 'object') return payload[key]
  }
  return payload
}

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeCategory(raw) {
  const slug =
    pick(raw, 'categorySlug', 'category_slug') ??
    slugify(pick(raw, 'categoryName', 'category_name') ?? '')
  const known = CATEGORY_BY_SLUG[slug]
  if (known) return known
  const name = pick(raw, 'categoryName', 'category_name')
  if (!name) return CATEGORY_BY_SLUG.other
  return { name, slug: slug || 'other', emoji: '🍽️', tint: 'from-stone-200 to-stone-300' }
}

export function normalizeShop(raw) {
  if (!raw) return null
  const name = pick(raw, 'name', 'shopName', 'shop_name') ?? 'Unnamed shop'
  return {
    id: pick(raw, 'id', 'shopId', 'shop_id') ?? null,
    ownerId: pick(raw, 'ownerId', 'owner_id', 'shopOwnerId', 'shop_owner_id') ?? null,
    name,
    slug: pick(raw, 'slug', 'shopSlug', 'shop_slug') ?? slugify(name),
    description: pick(raw, 'description', 'about') ?? '',
    profileImageUrl: pick(raw, 'profileImageUrl', 'profile_image_url', 'shopImageUrl', 'shop_image_url') ?? null,
    coverImageUrl: pick(raw, 'coverImageUrl', 'cover_image_url') ?? null,
    address: pick(raw, 'address', 'shopAddress', 'shop_address') ?? '',
    city: pick(raw, 'city', 'shopCity', 'shop_city') ?? '',
    latitude: num(pick(raw, 'latitude', 'shopLatitude', 'shop_latitude')),
    longitude: num(pick(raw, 'longitude', 'shopLongitude', 'shop_longitude')),
    contactPhone: pick(raw, 'contactPhone', 'contact_phone', 'shopPhone', 'shop_phone') ?? '',
    contactEmail: pick(raw, 'contactEmail', 'contact_email') ?? '',
    categories: pick(raw, 'categories') ?? [],
    openingHours: pick(raw, 'openingHours', 'opening_hours') ?? null,
    favoriteCount: num(pick(raw, 'favoriteCount', 'favorite_count')),
    promotionCount: num(pick(raw, 'promotionCount', 'promotion_count', 'activePromotions')),
  }
}

export function normalizePromotion(raw) {
  if (!raw) return null
  const shopSource = raw.shop && typeof raw.shop === 'object' ? raw.shop : raw
  const shop = normalizeShop(shopSource)

  const promotion = {
    id: pick(raw, 'id', 'promotionId', 'promotion_id') ?? null,
    shopId: pick(raw, 'shopId', 'shop_id') ?? shop?.id ?? null,
    categoryId: pick(raw, 'categoryId', 'category_id') ?? null,
    productName: pick(raw, 'productName', 'product_name', 'name') ?? 'Untitled item',
    description: pick(raw, 'description') ?? '',
    imageUrl: pick(raw, 'imageUrl', 'image_url') ?? null,
    originalPrice: num(pick(raw, 'originalPrice', 'original_price')) ?? 0,
    promoPrice: num(pick(raw, 'promoPrice', 'promo_price', 'promotionPrice', 'price')) ?? 0,
    quantityAvailable: num(pick(raw, 'quantityAvailable', 'quantity_available', 'quantity')) ?? 0,
    startsAt: pick(raw, 'startsAt', 'starts_at', 'startTime') ?? null,
    endsAt: pick(raw, 'endsAt', 'ends_at', 'dueTime', 'due_time') ?? null,
    foodExpiresAt: pick(raw, 'foodExpiresAt', 'food_expires_at') ?? null,
    pickupLocation: pick(raw, 'pickupLocation', 'pickup_location') ?? shop?.address ?? '',
    createdAt: pick(raw, 'createdAt', 'created_at') ?? null,
    updatedAt: pick(raw, 'updatedAt', 'updated_at') ?? null,
    distanceKm: num(pick(raw, 'distanceKm', 'distance_km')),
    category: normalizeCategory(raw.category && typeof raw.category === 'object' ? raw.category : raw),
    shop,
  }

  const status = pick(raw, 'status')
  promotion.status = status ? String(status).toLowerCase() : computeStatus(promotion)
  return promotion
}

export function normalizeReservation(raw) {
  if (!raw) return null
  const promotionSource = raw.promotion ?? raw.promotion_listing ?? null
  return {
    id: pick(raw, 'id', 'reservationId', 'reservation_id') ?? null,
    promotionId: pick(raw, 'promotionId', 'promotion_id') ?? promotionSource?.id ?? null,
    customerId: pick(raw, 'customerId', 'customer_id') ?? null,
    customerName: pick(raw, 'customerName', 'customer_name', 'fullName', 'full_name') ?? '',
    customerPhone: pick(raw, 'customerPhone', 'customer_phone', 'phone') ?? '',
    quantity: num(pick(raw, 'quantity')) ?? 1,
    status: String(pick(raw, 'status') ?? 'reserved').toLowerCase(),
    pickupCode: pick(raw, 'pickupCode', 'pickup_code') ?? null,
    pickupBy: pick(raw, 'pickupBy', 'pickup_by') ?? null,
    createdAt: pick(raw, 'createdAt', 'created_at') ?? null,
    promotion: promotionSource ? normalizePromotion(promotionSource) : null,
  }
}

export function normalizeUser(raw) {
  if (!raw) return null
  const source = raw.user ?? raw.profile ?? raw
  return {
    id: pick(source, 'id', 'userId', 'user_id') ?? null,
    email: pick(source, 'email') ?? '',
    fullName: pick(source, 'fullName', 'full_name', 'name') ?? '',
    role: String(pick(source, 'role') ?? 'customer').toLowerCase(),
    avatarUrl: pick(source, 'avatarUrl', 'avatar_url', 'picture') ?? null,
    phone: pick(source, 'phone', 'contactPhone', 'contact_phone') ?? '',
    city: pick(source, 'city') ?? '',
    latitude: num(pick(source, 'latitude')),
    longitude: num(pick(source, 'longitude')),
    shopId: pick(source, 'shopId', 'shop_id') ?? pick(raw, 'shopId', 'shop_id') ?? null,
    shopSlug: pick(source, 'shopSlug', 'shop_slug') ?? null,
  }
}

/**
 * Write payloads use the column names from backend/supabase/schema.sql so the
 * API can pass them to Supabase with no extra mapping.
 */
export function serializePromotion(form) {
  return {
    product_name: form.productName?.trim(),
    description: form.description?.trim() || null,
    image_url: form.imageUrl?.trim() || null,
    category_slug: form.categorySlug || null,
    original_price: Number(form.originalPrice),
    promo_price: Number(form.promoPrice),
    quantity_available: Number(form.quantityAvailable),
    starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    food_expires_at: form.foodExpiresAt ? new Date(form.foodExpiresAt).toISOString() : null,
    pickup_location: form.pickupLocation?.trim() || null,
  }
}

export function serializeShop(form) {
  return {
    name: form.name?.trim(),
    description: form.description?.trim() || null,
    profile_image_url: form.profileImageUrl?.trim() || null,
    cover_image_url: form.coverImageUrl?.trim() || null,
    address: form.address?.trim() || null,
    city: form.city?.trim() || null,
    latitude: form.latitude === '' || form.latitude == null ? null : Number(form.latitude),
    longitude: form.longitude === '' || form.longitude == null ? null : Number(form.longitude),
    contact_phone: form.contactPhone?.trim() || null,
    contact_email: form.contactEmail?.trim() || null,
    categories: form.categories ?? [],
    opening_hours: form.openingHours ?? null,
  }
}
