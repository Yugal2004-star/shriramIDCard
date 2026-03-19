import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase.js'

const router = Router()

router.get('/health', async (req, res) => {
  try {
    // Ping Supabase
    const { error } = await supabaseAdmin.from('submissions').select('id').limit(1)
    res.json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      supabase:  error ? 'error' : 'connected',
      version:   '2.0.0',
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

export default router
