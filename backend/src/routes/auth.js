import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { AppError, asyncHandler, unwrap } from '../lib/errors.js'
import { serializeProfile } from '../lib/serialize.js'
import { requireAuth, requireSupabase } from '../middleware/auth.js'
import { createProfileSchema, parseBody, updateProfileSchema } from '../validators.js'

const router = Router()

router.use(requireSupabase)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
      },
      profile: serializeProfile(req.profile),
    })
  })
)

router.post(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.profile) {
      throw new AppError(409, 'Profile already exists. Role cannot be changed.', 'PROFILE_EXISTS')
    }

    const body = parseBody(createProfileSchema, req.body)

    const result = await supabase
      .from('profiles')
      .insert({
        id: req.user.id,
        role: body.role,
        full_name: body.fullName || req.user.user_metadata?.full_name || null,
        city: body.city || null,
      })
      .select('*')
      .single()

    const profile = unwrap(result)

    res.status(201).json({
      profile: serializeProfile(profile),
    })
  })
)

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.profile) {
      throw new AppError(403, 'Create your profile first', 'PROFILE_REQUIRED')
    }

    const body = parseBody(updateProfileSchema, req.body)
    const updates = {}

    if (body.fullName !== undefined) updates.full_name = body.fullName
    if (body.city !== undefined) updates.city = body.city
    if (body.latitude !== undefined) updates.latitude = body.latitude
    if (body.longitude !== undefined) updates.longitude = body.longitude
    if (body.emailNotificationsEnabled !== undefined) {
      updates.email_notifications_enabled = body.emailNotificationsEnabled
    }
    if (body.notifyFavoriteShops !== undefined) {
      updates.notify_favorite_shops = body.notifyFavoriteShops
    }

    const result = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('*')
      .single()

    res.json({
      profile: serializeProfile(unwrap(result)),
    })
  })
)

export default router
