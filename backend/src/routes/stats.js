import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { asyncHandler, unwrap } from '../lib/errors.js'
import { requireSupabase } from '../middleware/auth.js'

const router = Router()

router.use(requireSupabase)

/** Public counters for the landing page. Everything is measured, never faked. */
router.get(
  '/impact',
  asyncHandler(async (_req, res) => {
    const [collected, shops, customers, activePromotions] = await Promise.all([
      supabase
        .from('reservations')
        .select('quantity, promotion:promotions(original_price, promo_price)')
        .eq('status', 'picked_up'),
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'customer'),
      supabase
        .from('promotion_listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])

    const rows = unwrap(collected) || []
    const mealsRescued = rows.reduce((total, row) => total + (row.quantity || 0), 0)
    const moneySaved = rows.reduce((total, row) => {
      const saving =
        Number(row.promotion?.original_price || 0) - Number(row.promotion?.promo_price || 0)
      return total + (row.quantity || 0) * Math.max(0, saving)
    }, 0)

    res.json({
      stats: {
        mealsRescued,
        moneySaved: Math.round(moneySaved),
        partnerShops: shops.count || 0,
        customers: customers.count || 0,
        activePromotions: activePromotions.count || 0,
      },
    })
  })
)

export default router
