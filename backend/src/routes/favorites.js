import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { AppError, asyncHandler, unwrap } from '../lib/errors.js'
import { paged, parsePagination } from '../lib/pagination.js'
import { serializePromotion, serializeShop } from '../lib/serialize.js'
import {
  requireAuth,
  requireProfile,
  requireRole,
  requireSupabase,
} from '../middleware/auth.js'
import { searchPromotions } from '../services/promotions.js'

const router = Router()

router.use(requireSupabase, requireAuth, requireProfile, requireRole('customer'))

async function favoriteShopIds(userId) {
  const rows = unwrap(
    await supabase.from('shop_favorites').select('shop_id').eq('user_id', userId)
  ) || []

  return rows.map((row) => row.shop_id)
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req.query)
    const result = await supabase
      .from('shop_favorites')
      .select('created_at, shop:shops(*)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const rows = unwrap(result) || []
    res.json(
      paged(
        rows.map((row) => ({
          shop: serializeShop(row.shop),
          favoritedAt: row.created_at,
        })),
        result.count || 0,
        { limit, offset }
      )
    )
  })
)

router.get(
  '/promotions',
  asyncHandler(async (req, res) => {
    const shopIds = await favoriteShopIds(req.user.id)
    if (!shopIds.length) {
      const { limit, offset } = parsePagination(req.query)
      return res.json(paged([], 0, { limit, offset }))
    }

    const result = await searchPromotions({
      ...req.query,
      shopIds,
      status: 'active',
    })

    res.json(
      paged(
        result.rows.map(serializePromotion),
        result.count,
        { limit: result.limit, offset: result.offset }
      )
    )
  })
)

router.post(
  '/:shopId',
  asyncHandler(async (req, res) => {
    const shop = unwrap(
      await supabase
        .from('shops')
        .select('*')
        .eq('id', req.params.shopId)
        .maybeSingle(),
      'Shop not found'
    )

    const result = await supabase
      .from('shop_favorites')
      .upsert(
        { user_id: req.user.id, shop_id: shop.id },
        { onConflict: 'user_id,shop_id', ignoreDuplicates: true }
      )
      .select('created_at')
      .maybeSingle()

    if (result.error) {
      throw new AppError(500, result.error.message, 'FAVORITE_SAVE_FAILED')
    }

    const existing = result.data || unwrap(
      await supabase
        .from('shop_favorites')
        .select('created_at')
        .eq('user_id', req.user.id)
        .eq('shop_id', shop.id)
        .single()
    )

    res.status(201).json({
      shop: serializeShop(shop),
      favoritedAt: existing.created_at,
    })
  })
)

router.delete(
  '/:shopId',
  asyncHandler(async (req, res) => {
    unwrap(
      await supabase
        .from('shop_favorites')
        .delete()
        .eq('user_id', req.user.id)
        .eq('shop_id', req.params.shopId)
    )

    res.status(204).send()
  })
)

export default router
