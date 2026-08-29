function money(value) {
  return value === null || value === undefined ? null : Number(value)
}

export function serializeProfile(profile) {
  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    city: profile.city,
    latitude: profile.latitude,
    longitude: profile.longitude,
    emailNotificationsEnabled: profile.email_notifications_enabled ?? true,
    notifyFavoriteShops: profile.notify_favorite_shops ?? true,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

export function serializeUser(profile, shop) {
  const base = serializeProfile(profile)
  if (!base) return null

  return {
    ...base,
    shopId: shop?.id ?? null,
    shopName: shop?.name ?? null,
    shopSlug: shop?.slug ?? null,
  }
}

export function serializeShop(shop) {
  if (!shop) return null

  return {
    id: shop.id,
    ownerId: shop.owner_id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description,
    profileImageUrl: shop.profile_image_url,
    coverImageUrl: shop.cover_image_url,
    address: shop.address,
    city: shop.city,
    latitude: shop.latitude,
    longitude: shop.longitude,
    contactPhone: shop.contact_phone,
    contactEmail: shop.contact_email,
    categories: shop.categories || [],
    openingHours: shop.opening_hours,
    createdAt: shop.created_at,
    updatedAt: shop.updated_at,
  }
}

export function serializeCategory(category) {
  if (!category) return null

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  }
}

export function serializePromotion(row) {
  if (!row) return null

  return {
    id: row.id,
    productName: row.product_name,
    description: row.description,
    imageUrl: row.image_url,
    originalPrice: money(row.original_price),
    promoPrice: money(row.promo_price),
    quantityAvailable: row.quantity_available,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    foodExpiresAt: row.food_expires_at,
    pickupLocation: row.pickup_location,
    status: row.status,
    ...(row.distance_km !== undefined && row.distance_km !== null
      ? { distanceKm: Math.round(Number(row.distance_km) * 10) / 10 }
      : {}),
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
    shop: {
      id: row.shop_id,
      name: row.shop_name,
      slug: row.shop_slug,
      city: row.shop_city,
      address: row.shop_address,
      imageUrl: row.shop_image_url,
      phone: row.shop_phone,
      latitude: row.shop_latitude,
      longitude: row.shop_longitude,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function serializeReservation(row) {
  if (!row) return null

  return {
    id: row.id,
    promotionId: row.promotion_id,
    customerId: row.customer_id,
    quantity: row.quantity,
    status: row.status,
    pickupBy: row.pickup_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    promotion: row.promotion ? serializePromotion(row.promotion) : undefined,
    customer: row.customer ? serializeProfile(row.customer) : undefined,
  }
}
