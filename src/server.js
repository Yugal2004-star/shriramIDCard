import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import healthRoutes           from './routes/health.routes.js'
import formConfigRoutes       from './routes/formConfigs.routes.js'
import submissionRoutes       from './routes/submissions.routes.js'
import organizationRoutes     from './routes/organizations.routes.js'
import cardTemplateRoutes     from './routes/cardTemplates.routes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
dotenv.config()
const app = express(), PORT = process.env.PORT || 5000
app.use(helmet())
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
app.use(cors({ origin:(origin,cb)=>(!origin||allowedOrigins.includes(origin)?cb(null,true):cb(new Error(`CORS: ${origin} not allowed`))), credentials:true, methods:['GET','POST','PATCH','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization'] }))
app.use('/api/', rateLimit({ windowMs:15*60*1000, max:100, standardHeaders:true, legacyHeaders:false }))
app.use('/api/submissions', rateLimit({ windowMs:60*60*1000, max:10 }))
app.use(express.json({ limit:'10mb' }))
app.use(express.urlencoded({ extended:true }))
if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV==='production'?'combined':'dev'))
app.use('/api',                healthRoutes)
app.use('/api/form-configs',   formConfigRoutes)
app.use('/api/submissions',    submissionRoutes)
app.use('/api/organizations',  organizationRoutes)
app.use('/api/card-templates', cardTemplateRoutes)
app.use(notFound)
app.use(errorHandler)
app.listen(PORT, ()=>{ console.log(`\n🚀 Shriram ID Cards Backend\n   Running on: http://localhost:${PORT}\n   Health: http://localhost:${PORT}/api/health\n`) })
export default app