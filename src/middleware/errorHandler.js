/**
 * Global error handler — catches any error passed via next(err)
 */
export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message)

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  // Supabase / DB errors
  if (err.code) {
    return res.status(400).json({ error: err.message, code: err.code })
  }

  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'
  res.status(status).json({ error: message })
}

/**
 * 404 handler — placed after all routes
 */
export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` })
}
