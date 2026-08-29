import { Router } from 'express'
import { asyncHandler } from '../lib/errors.js'
import { paged } from '../lib/pagination.js'
import { serializeCategory, serializePromotion } from '../lib/serialize.js'
import {
  optionalAuth,
  requireAuth,
  requireProfile,
  requireRole,
  requireSupabase,
} from '../middleware/auth.js'
import {
  getPersonalizedPromotions,
  getPromotionListing,
  listDashboard,
  searchPromotions,
} from '../services/promotions.js'

const router = Router()

router.use(requireSupabase)

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { rows, count, limit, offset } = await searchPromotions(req.query)

    res.json(
      paged(
        rows.map(serializePromotion),
        count,
        { limit, offset }
      )
    )
  })
)

router.get(
  '/dashboard',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const hasQueryLocation =
      req.query.latitude !== undefined && req.query.longitude !== undefined
    const hasProfileLocation =
      req.profile?.latitude != null && req.profile?.longitude != null
    const data = await listDashboard({
      userId: req.profile?.role === 'customer' ? req.user?.id : null,
      ...(hasQueryLocation
        ? {
            latitude: req.query.latitude,
            longitude: req.query.longitude,
            radiusKm: req.query.radiusKm,
          }
        : hasProfileLocation
          ? {
              latitude: req.profile.latitude,
              longitude: req.profile.longitude,
              radiusKm: req.query.radiusKm,
            }
          : {}),
    })

    res.json({
      availableNow: data.availableNow.map(serializePromotion),
      endingSoon: data.endingSoon.map(serializePromotion),
      categories: data.categories.map(serializeCategory),
      byCategory: Object.fromEntries(
        Object.entries(data.byCategory).map(([slug, items]) => [
          slug,
          items.map(serializePromotion),
        ])
      ),
      personalized: data.personalized.map(serializePromotion),
      fromFavoriteShops: data.fromFavoriteShops.map(serializePromotion),
      nearby: data.nearby.map(serializePromotion),
    })
  })
)

router.get(
  '/personalized',
  requireAuth,
  requireProfile,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const params = {
      ...req.query,
      ...(req.query.latitude === undefined && req.profile.latitude != null
        ? {
            latitude: req.profile.latitude,
            longitude: req.profile.longitude,
          }
        : {}),
    }
    const result = await getPersonalizedPromotions(req.user.id, params)

    res.json(
      paged(
        result.rows.map(serializePromotion),
        result.count,
        { limit: result.limit, offset: result.offset }
      )
    )
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await getPromotionListing(req.params.id)

    res.json({
      promotion: serializePromotion(row),
      pickupOnly: true,
      pickupNote: 'Pickup only — please visit the shop to collect your order.',
    })
  })
)

export default router
