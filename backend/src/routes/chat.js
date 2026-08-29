import { Router } from 'express'
import { isSupabaseConfigured } from '../config/supabase.js'
import { asyncHandler } from '../lib/errors.js'
import { serializePromotion } from '../lib/serialize.js'
import { optionalAuth } from '../middleware/auth.js'
import { composeChatReply, extractSearchCriteria, isGeminiConfigured } from '../services/gemini.js'
import { criteriaToSearchParams } from '../services/intent.js'
import { getFavoriteShopIds, searchPromotions } from '../services/promotions.js'
import { chatSchema, parseBody } from '../validators.js'

const router = Router()

router.post(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = parseBody(chatSchema, req.body)
    const hasBodyLocation = body.latitude !== undefined
    const context = {
      city: body.city || req.profile?.city || null,
      latitude: hasBodyLocation ? body.latitude : req.profile?.latitude,
      longitude: hasBodyLocation ? body.longitude : req.profile?.longitude,
      radiusKm: body.radiusKm || Number(process.env.CHAT_DEFAULT_RADIUS_KM) || 5,
    }

    const { criteria, source } = await extractSearchCriteria(
      body.message,
      body.history || [],
      context
    )

    let promotions = []
    let catalogAvailable = Boolean(isSupabaseConfigured)
    let catalogError = null
    const favoriteRequest = criteria.shopPreference === 'favorites'
    const favoriteAccessAllowed =
      Boolean(req.user) && req.profile?.role === 'customer'

    if (favoriteRequest && favoriteAccessAllowed) {
      context.favoriteShopIds = await getFavoriteShopIds(req.user.id)
    }

    if (
      isSupabaseConfigured
      && criteria.intent !== 'help'
      && (!favoriteRequest || favoriteAccessAllowed)
    ) {
      try {
        const result = await searchPromotions(criteriaToSearchParams(criteria, context))
        promotions = (result.rows || []).map(serializePromotion)
      } catch (err) {
        catalogAvailable = false
        catalogError = err.message
      }
    }

    if (!isSupabaseConfigured) {
      catalogAvailable = false
    }

    const reply = favoriteRequest && !favoriteAccessAllowed
      ? 'Sign in with a customer account to search promotions from your favorite shops.'
      : await composeChatReply({
          message: body.message,
          criteria,
          promotions,
          catalogAvailable,
        })

    res.json({
      reply,
      criteria,
      promotions,
      pickupOnly: true,
      meta: {
        intentSource: source,
        geminiConfigured: isGeminiConfigured(),
        catalogAvailable,
        catalogError,
      },
    })
  })
)

export default router
