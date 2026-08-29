import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { asyncHandler, unwrap } from '../lib/errors.js'
import { serializePromotion, serializeShop } from '../lib/serialize.js'
import { requireSupabase } from '../middleware/auth.js'

const router = Router()

router.use(requireSupabase)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const shopResult = await supabase
      .from('shops')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle()

    const shop = unwrap(shopResult, 'Shop not found')

    const promotionsResult = await supabase
      .from('promotion_listings')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .order('ends_at', { ascending: true })

    res.json({
      shop: serializeShop(shop),
      promotions: (unwrap(promotionsResult) || []).map(serializePromotion),
    })
  })
)

export default router
