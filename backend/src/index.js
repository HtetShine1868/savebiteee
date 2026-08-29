import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import categoriesRouter from './routes/categories.js'
import shopsRouter from './routes/shops.js'
import promotionsRouter from './routes/promotions.js'
import reservationsRouter from './routes/reservations.js'
import ownerRouter from './routes/owner.js'
import chatRouter from './routes/chat.js'
import favoritesRouter from './routes/favorites.js'
import statsRouter from './routes/stats.js'

const app = express()
const port = Number(process.env.PORT) || 5000

// CLIENT_URL accepts a comma-separated list so the deployed site and local dev
// can talk to the same API.
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
)

// Netlify deploy previews and renamed sites get a new subdomain every time, so
// they are trusted by pattern instead of needing a redeploy of this API.
// Sessions are bearer tokens, not cookies, so no ambient credentials are shared.
const ALLOWED_HOST_PATTERNS = [/\.netlify\.app$/, /^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/]

function isAllowedOrigin(origin) {
  if (allowedOrigins.has(origin.replace(/\/$/, ''))) return true

  try {
    const { host } = new URL(origin)
    return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(host))
  } catch {
    return false
  }
}

app.use(
  cors({
    origin(origin, callback) {
      // A rejected origin is answered without the CORS headers rather than as a
      // server error, which keeps the browser message readable.
      callback(null, !origin || isAllowedOrigin(origin))
    },
    credentials: true,
  })
)
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/shops', shopsRouter)
app.use('/api/promotions', promotionsRouter)
app.use('/api/reservations', reservationsRouter)
app.use('/api/owner', ownerRouter)
app.use('/api/chat', chatRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/stats', statsRouter)

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  })
})

app.use((err, _req, res, _next) => {
  const status = err.status || 500

  if (status >= 500) {
    console.error(err)
  }

  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'ERROR',
    details: err.details,
  })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
