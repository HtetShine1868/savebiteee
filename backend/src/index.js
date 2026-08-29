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

const app = express()
const port = Number(process.env.PORT) || 5000
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: clientUrl,
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
