import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { asyncHandler, unwrap } from '../lib/errors.js'
import { serializeCategory } from '../lib/serialize.js'
import { requireSupabase } from '../middleware/auth.js'

const router = Router()

router.use(requireSupabase)

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await supabase.from('categories').select('*').order('name')
    res.json({
      items: (unwrap(result) || []).map(serializeCategory),
    })
  })
)

export default router
