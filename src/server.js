import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import healthRoutes       from './routes/health.routes.js'
import formConfigRoutes   from './routes/formConfigs.routes.js'
import submissionRoutes   from './routes/submissions.routes.js'
import organizationRoutes from './routes/organizations.routes.js'
import cardTemplateRoutes from './routes/cardTemplates.routes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000


app.use(helmet())

/* ── Trust Render's proxy so rate limiting works per real IP ── */
app.set('trust proxy', 1)

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://shreeramidcardsss.netlify.app')

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
    methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

/* ── General rate limiter — all API routes ─────────────────────
   JSON handler so frontend can parse the error properly         */
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                   // increased from 100
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    error: 'Too many requests. Please wait a few minutes and try again.'
  }),
}))

/* ── Submission limiter — relaxed for shared IPs on free hosting
   On Render free tier all traffic comes from shared IPs,
   so a strict per-IP limit blocks real users.                   */
app.use('/api/submissions', rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 50,                    // increased from 10 → 50 per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    error: 'Too many submissions from this device. Please try again in an hour.'
  }),
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

app.use('/api',               healthRoutes)
app.use('/api/form-configs',  formConfigRoutes)
app.use('/api/submissions',   submissionRoutes)
app.use('/api/organizations', organizationRoutes)
app.use('/api/card-templates',cardTemplateRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Shriram ID Cards Backend`)
  console.log(`   Running on: http://0.0.0.0:${PORT}`)
  console.log(`   Health: http://0.0.0.0:${PORT}/api/health\n`)
})

export default app