import { Router } from 'express'
import { isSupabaseConfigured, supabase } from '../config/supabase.js'
import { isGeminiConfigured } from '../services/gemini.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'food-waste-api',
    timestamp: new Date().toISOString(),
    geminiConfigured: isGeminiConfigured(),
  })
})

router.get('/supabase', async (_req, res) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({
      connected: false,
      message:
        'Supabase env vars are missing. Copy backend/.env.example to backend/.env and add your project keys.',
    })
  }

  try {
    const { error } = await supabase.from('categories').select('id').limit(1)

    if (error) {
      return res.status(502).json({
        connected: false,
        message: error.message,
        hint: 'Run backend/supabase/schema.sql in the Supabase SQL Editor.',
      })
    }

    return res.json({
      connected: true,
      schemaReady: true,
      url: process.env.SUPABASE_URL,
    })
  } catch (err) {
    return res.status(502).json({
      connected: false,
      message: err.message,
    })
  }
})

export default router
