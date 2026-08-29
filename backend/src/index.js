import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'

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

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
