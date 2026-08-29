import { Router } from 'express'
import { isSupabaseConfigured, supabase } from '../config/supabase.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'food-waste-api',
    timestamp: new Date().toISOString(),
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
    const { error } = await supabase.auth.getSession()

    if (error) {
      return res.status(502).json({
        connected: false,
        message: error.message,
      })
    }

    return res.json({
      connected: true,
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
