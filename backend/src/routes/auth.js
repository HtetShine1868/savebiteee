import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { AppError, asyncHandler, unwrap } from '../lib/errors.js'
import {
  hashPassword,
  isAuthConfigured,
  signToken,
  verifyGoogleIdToken,
  verifyPassword,
} from '../lib/auth-tokens.js'
import { serializeProfile, serializeUser } from '../lib/serialize.js'
import { slugify } from '../lib/slug.js'
import { requireAuth, requireSupabase } from '../middleware/auth.js'
import {
  googleAuthSchema,
  loginSchema,
  parseBody,
  registerSchema,
  updateProfileSchema,
} from '../validators.js'

const router = Router()

router.use(requireSupabase)

/**
 * Fail before writing anything: without a signing key we could otherwise
 * create an account and then be unable to hand back a session.
 */
router.use((_req, _res, next) => {
  if (!isAuthConfigured) {
    return next(
      new AppError(
        503,
        'Sign-in is not configured on the server yet. Set JWT_SECRET and redeploy.',
        'JWT_NOT_CONFIGURED'
      )
    )
  }

  next()
})

async function findProfileByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .maybeSingle()

  if (error) {
    throw new AppError(500, error.message, 'PROFILE_LOOKUP_FAILED')
  }

  return data
}

async function findOwnerShop(profile) {
  if (profile?.role !== 'owner') return null

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new AppError(500, error.message, 'SHOP_LOOKUP_FAILED')
  }

  return data
}

async function createShopForOwner(profile, shopName) {
  const result = await supabase
    .from('shops')
    .insert({
      owner_id: profile.id,
      name: shopName,
      slug: slugify(shopName),
      city: profile.city || null,
      contact_email: profile.email || null,
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
    })
    .select('*')
    .single()

  return unwrap(result)
}

async function respondWithSession(res, profile, { status = 200, extra = {} } = {}) {
  const shop = await findOwnerShop(profile)

  res.status(status).json({
    token: signToken(profile),
    user: serializeUser(profile, shop),
    profile: serializeProfile(profile),
    ...extra,
  })
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = parseBody(registerSchema, req.body)

    if (await findProfileByEmail(body.email)) {
      throw new AppError(409, 'An account with this email already exists', 'EMAIL_TAKEN')
    }

    const result = await supabase
      .from('profiles')
      .insert({
        email: body.email,
        password_hash: await hashPassword(body.password),
        role: body.role,
        full_name: body.fullName || null,
        city: body.city || null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        auth_provider: 'password',
      })
      .select('*')
      .single()

    if (result.error?.code === '23505') {
      throw new AppError(409, 'An account with this email already exists', 'EMAIL_TAKEN')
    }

    const profile = unwrap(result)

    if (profile.role === 'owner' && body.shopName) {
      await createShopForOwner(profile, body.shopName)
    }

    await respondWithSession(res, profile, { status: 201 })
  })
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = parseBody(loginSchema, req.body)
    const profile = await findProfileByEmail(body.email)
    const passwordMatches = await verifyPassword(body.password, profile?.password_hash)

    if (!profile || !passwordMatches) {
      throw new AppError(401, 'Incorrect email or password', 'INVALID_CREDENTIALS')
    }

    await respondWithSession(res, profile)
  })
)

router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const body = parseBody(googleAuthSchema, req.body)
    const googleUser = await verifyGoogleIdToken(body.idToken)

    let profile = await findProfileByEmail(googleUser.email)
    let created = false

    if (!profile) {
      const result = await supabase
        .from('profiles')
        .insert({
          email: googleUser.email,
          role: body.role || 'customer',
          full_name: googleUser.fullName,
          avatar_url: googleUser.avatarUrl,
          auth_provider: 'google',
        })
        .select('*')
        .single()

      profile = unwrap(result)
      created = true

      if (profile.role === 'owner' && body.shopName) {
        await createShopForOwner(profile, body.shopName)
      }
    } else if (googleUser.avatarUrl && !profile.avatar_url) {
      profile = unwrap(
        await supabase
          .from('profiles')
          .update({ avatar_url: googleUser.avatarUrl })
          .eq('id', profile.id)
          .select('*')
          .single()
      )
    }

    await respondWithSession(res, profile, {
      status: created ? 201 : 200,
      extra: { isNewAccount: created },
    })
  })
)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const shop = await findOwnerShop(req.profile)

    res.json({
      user: serializeUser(req.profile, shop),
      profile: serializeProfile(req.profile),
    })
  })
)

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
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

    if (!Object.keys(updates).length) {
      const shop = await findOwnerShop(req.profile)
      return res.json({
        user: serializeUser(req.profile, shop),
        profile: serializeProfile(req.profile),
      })
    }

    const profile = unwrap(
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', req.user.id)
        .select('*')
        .single()
    )

    const shop = await findOwnerShop(profile)

    res.json({
      user: serializeUser(profile, shop),
      profile: serializeProfile(profile),
    })
  })
)

router.post('/logout', (_req, res) => {
  res.status(204).send()
})

export default router
