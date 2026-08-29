import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { AppError, asyncHandler, unwrap } from '../lib/errors.js'
import { serializePromotion, serializeReservation, serializeShop } from '../lib/serialize.js'
import { slugify } from '../lib/slug.js'
import {
  requireAuth,
  requireProfile,
  requireRole,
  requireSupabase,
} from '../middleware/auth.js'
import { getListingsByIds, getPromotionListing } from '../services/promotions.js'
import {
  createPromotionSchema,
  createShopSchema,
  ownerReservationStatusSchema,
  parseBody,
  updatePromotionSchema,
  updateShopSchema,
} from '../validators.js'
import { notifyFavoriteShopPromotion } from '../services/notifications.js'

const router = Router()

router.use(requireSupabase, requireAuth, requireProfile, requireRole('owner'))

async function getOwnedShop(shopId, ownerId) {
  const result = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .eq('owner_id', ownerId)
    .maybeSingle()

  return unwrap(result, 'Shop not found')
}

function shopWritePayload(body, extras = {}) {
  return {
    ...extras,
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.profileImageUrl !== undefined
      ? { profile_image_url: body.profileImageUrl }
      : {}),
    ...(body.coverImageUrl !== undefined ? { cover_image_url: body.coverImageUrl } : {}),
    ...(body.address !== undefined ? { address: body.address } : {}),
    ...(body.city !== undefined ? { city: body.city } : {}),
    ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
    ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
    ...(body.contactPhone !== undefined ? { contact_phone: body.contactPhone } : {}),
    ...(body.contactEmail !== undefined ? { contact_email: body.contactEmail } : {}),
    ...(body.categories !== undefined ? { categories: body.categories } : {}),
    ...(body.openingHours !== undefined ? { opening_hours: body.openingHours } : {}),
  }
}

function promotionWritePayload(body) {
  return {
    ...(body.categoryId !== undefined ? { category_id: body.categoryId } : {}),
    ...(body.productName !== undefined ? { product_name: body.productName } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.imageUrl !== undefined ? { image_url: body.imageUrl } : {}),
    ...(body.originalPrice !== undefined ? { original_price: body.originalPrice } : {}),
    ...(body.promoPrice !== undefined ? { promo_price: body.promoPrice } : {}),
    ...(body.quantityAvailable !== undefined
      ? { quantity_available: body.quantityAvailable }
      : {}),
    ...(body.startsAt !== undefined ? { starts_at: body.startsAt } : {}),
    ...(body.endsAt !== undefined ? { ends_at: body.endsAt } : {}),
    ...(body.foodExpiresAt !== undefined ? { food_expires_at: body.foodExpiresAt } : {}),
    ...(body.pickupLocation !== undefined ? { pickup_location: body.pickupLocation } : {}),
  }
}

router.get(
  '/shops',
  asyncHandler(async (req, res) => {
    const result = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false })

    res.json({
      items: (unwrap(result) || []).map(serializeShop),
    })
  })
)

router.post(
  '/shops',
  asyncHandler(async (req, res) => {
    const body = parseBody(createShopSchema, req.body)

    const result = await supabase
      .from('shops')
      .insert(
        shopWritePayload(body, {
          owner_id: req.user.id,
          slug: slugify(body.name),
        })
      )
      .select('*')
      .single()

    res.status(201).json({
      shop: serializeShop(unwrap(result)),
    })
  })
)

router.patch(
  '/shops/:id',
  asyncHandler(async (req, res) => {
    const shop = await getOwnedShop(req.params.id, req.user.id)
    const body = parseBody(updateShopSchema, req.body)

    const result = await supabase
      .from('shops')
      .update(shopWritePayload(body))
      .eq('id', shop.id)
      .select('*')
      .single()

    res.json({
      shop: serializeShop(unwrap(result)),
    })
  })
)

router.get(
  '/promotions',
  asyncHandler(async (req, res) => {
    const shops = unwrap(
      await supabase.from('shops').select('id').eq('owner_id', req.user.id)
    ) || []

    const shopIds = shops.map((shop) => shop.id)
    if (!shopIds.length) {
      return res.json({ items: [] })
    }

    let query = supabase
      .from('promotion_listings')
      .select('*')
      .in('shop_id', shopIds)
      .order('created_at', { ascending: false })

    if (req.query.shopId) {
      if (!shopIds.includes(req.query.shopId)) {
        throw new AppError(403, 'You do not own this shop', 'FORBIDDEN')
      }
      query = query.eq('shop_id', req.query.shopId)
    }

    const result = await query

    res.json({
      items: (unwrap(result) || []).map(serializePromotion),
    })
  })
)

router.post(
  '/promotions',
  asyncHandler(async (req, res) => {
    const body = parseBody(createPromotionSchema, req.body)
    await getOwnedShop(body.shopId, req.user.id)

    const result = await supabase
      .from('promotions')
      .insert({
        shop_id: body.shopId,
        ...promotionWritePayload(body),
      })
      .select('id')
      .single()

    const created = unwrap(result)
    const listing = await getPromotionListing(created.id)

    res.status(201).json({
      promotion: serializePromotion(listing),
    })

    void notifyFavoriteShopPromotion(listing).catch((error) => {
      console.error('Promotion notification dispatch failed:', error)
    })
  })
)

router.patch(
  '/promotions/:id',
  asyncHandler(async (req, res) => {
    const listing = await getPromotionListing(req.params.id)
    if (listing.shop_owner_id !== req.user.id) {
      throw new AppError(403, 'You do not own this promotion', 'FORBIDDEN')
    }

    const body = parseBody(updatePromotionSchema, req.body)

    const result = await supabase
      .from('promotions')
      .update(promotionWritePayload(body))
      .eq('id', listing.id)
      .select('id')
      .single()

    unwrap(result)
    const updated = await getPromotionListing(listing.id)

    res.json({
      promotion: serializePromotion(updated),
    })
  })
)

router.delete(
  '/promotions/:id',
  asyncHandler(async (req, res) => {
    const listing = await getPromotionListing(req.params.id)
    if (listing.shop_owner_id !== req.user.id) {
      throw new AppError(403, 'You do not own this promotion', 'FORBIDDEN')
    }

    const active = unwrap(
      await supabase
        .from('reservations')
        .select('id')
        .eq('promotion_id', listing.id)
        .eq('status', 'reserved')
        .limit(1)
    )

    if (active?.length) {
      throw new AppError(
        409,
        'This promotion still has reserved orders. Cancel or complete them first.',
        'HAS_ACTIVE_RESERVATIONS'
      )
    }

    unwrap(
      await supabase.from('promotions').delete().eq('id', listing.id)
    )

    res.status(204).send()
  })
)

router.get(
  '/reservations',
  asyncHandler(async (req, res) => {
    const shops = unwrap(
      await supabase.from('shops').select('id').eq('owner_id', req.user.id)
    ) || []
    const shopIds = shops.map((shop) => shop.id)

    if (!shopIds.length) {
      return res.json({ items: [] })
    }

    const promotionRows = unwrap(
      await supabase.from('promotions').select('id').in('shop_id', shopIds)
    ) || []
    const promotionIds = promotionRows.map((row) => row.id)

    if (!promotionIds.length) {
      return res.json({ items: [] })
    }

    let query = supabase
      .from('reservations')
      .select('*, customer:profiles!reservations_customer_id_fkey(*)')
      .in('promotion_id', promotionIds)
      .order('created_at', { ascending: false })

    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }

    const rows = unwrap(await query) || []
    const listings = await getListingsByIds(rows.map((row) => row.promotion_id))

    res.json({
      items: rows.map((row) =>
        serializeReservation({
          ...row,
          promotion: listings[row.promotion_id] || null,
        })
      ),
    })
  })
)

router.patch(
  '/reservations/:id',
  asyncHandler(async (req, res) => {
    const body = parseBody(ownerReservationStatusSchema, req.body)

    const result = await supabase.rpc('set_reservation_status', {
      p_reservation_id: req.params.id,
      p_owner_id: req.user.id,
      p_status: body.status,
    })

    const reservation = unwrap(result)
    const listings = await getListingsByIds([reservation.promotion_id])

    res.json({
      reservation: serializeReservation({
        ...reservation,
        promotion: listings[reservation.promotion_id] || null,
      }),
    })
  })
)

export default router
