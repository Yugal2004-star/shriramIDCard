import { supabaseAdmin } from '../config/supabase.js'
import { formConfigSchema } from '../middleware/validate.js'
import { v4 as uuidv4 } from 'uuid'

const genUrlId = () => Array.from({ length: 24 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')

/* GET /api/form-configs — list all (admin only) */
export async function listFormConfigs(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('form_configs')
      .select('*, submissions(count)')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ data })
  } catch (err) { next(err) }
}

/* GET /api/form-configs/:urlId — get one by URL id (public) */
export async function getFormConfigByUrlId(req, res, next) {
  try {
    const { urlId } = req.params
    const { data, error } = await supabaseAdmin
      .from('form_configs')
      .select('*')
      .eq('url_id', urlId)
      .eq('is_active', true)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Form link not found or inactive' })

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This form link has expired' })
    }

    res.json({ data })
  } catch (err) { next(err) }
}

/* POST /api/form-configs — create new link (admin only) */
export async function createFormConfig(req, res, next) {
  try {
    const body    = formConfigSchema.parse(req.body)
    const url_id  = genUrlId()

    const { data, error } = await supabaseAdmin
      .from('form_configs')
      .insert([{ ...body, url_id, created_by: req.user.id }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ data, url: `${req.headers.origin || ''}/form/${url_id}` })
  } catch (err) { next(err) }
}

/* PATCH /api/form-configs/:id — toggle active or update (admin only) */
export async function updateFormConfig(req, res, next) {
  try {
    const { id } = req.params
    const allowed = ['is_active', 'expires_at', 'fields', 'school_name']
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)))

    const { data, error } = await supabaseAdmin
      .from('form_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ data })
  } catch (err) { next(err) }
}

/* DELETE /api/form-configs/:id — delete (admin only) */
export async function deleteFormConfig(req, res, next) {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin.from('form_configs').delete().eq('id', id)
    if (error) throw error
    res.json({ message: 'Form config deleted' })
  } catch (err) { next(err) }
}
