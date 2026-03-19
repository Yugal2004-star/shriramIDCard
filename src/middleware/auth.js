import { supabaseAnon } from '../config/supabase.js'

/**
 * Middleware: verifies the Supabase JWT sent from the frontend.
 * Frontend must send:  Authorization: Bearer <supabase_access_token>
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.split(' ')[1]

  const { data: { user }, error } = await supabaseAnon.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' })
  }

  req.user = user   // attach user to request for downstream use
  next()
}

/**
 * Optional auth — attaches user if token present, continues either way.
 * Used for routes that are public but behave differently for auth users.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const { data: { user } } = await supabaseAnon.auth.getUser(token)
    req.user = user || null
  } else {
    req.user = null
  }
  next()
}
