import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { asyncHandler, unwrap } from '../lib/errors.js'
import { serializeReservation } from '../lib/serialize.js'
import { requireAuth, requireProfile, requireRole, requireSupabase } from '../middleware/auth.js'
import { getListingsByIds } from '../services/promotions.js'
import { createReservationSchema, parseBody } from '../validators.js'

const router = Router()

router.use(requireSupabase, requireAuth, requireProfile, requireRole('customer'))

async function withPromotions(reservations) {
  const listings = await getListingsByIds(reservations.map((row) => row.promotion_id))

  return reservations.map((row) =>
    serializeReservation({
      ...row,
      promotion: listings[row.promotion_id] || null,
    })
  )
}

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const result = await supabase
      .from('reservations')
      .select('*')
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false })

    const rows = unwrap(result) || []

    res.json({
      items: await withPromotions(rows),
    })
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseBody(createReservationSchema, req.body)

    const result = await supabase.rpc('reserve_promotion', {
      p_promotion_id: body.promotionId,
      p_customer_id: req.user.id,
      p_quantity: body.quantity,
    })

    const reservation = unwrap(result)
    const items = await withPromotions([reservation])

    res.status(201).json({
      reservation: items[0],
      pickupOnly: true,
      pickupNote: 'Pickup only — please visit the shop to collect your order.',
    })
  })
)

router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const result = await supabase.rpc('cancel_reservation', {
      p_reservation_id: req.params.id,
      p_customer_id: req.user.id,
    })

    const reservation = unwrap(result)
    const items = await withPromotions([reservation])

    res.json({
      reservation: items[0],
    })
  })
)

export default router
