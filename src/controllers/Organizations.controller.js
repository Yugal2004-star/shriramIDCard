import { supabaseAdmin } from '../config/supabase.js'

const ORG_BUCKET = 'org-logos'

/* GET /api/organizations */
export async function listOrganizations(req, res, next) {
  try {
    const { type } = req.query
    let query = supabaseAdmin
      .from('organizations')
      .select('*')
      .order('name', { ascending: true })
    if (type) query = query.eq('type', type)
    const { data, error } = await query
    if (error) throw error
    res.json({ data })
  } catch (err) { next(err) }
}

/* GET /api/organizations/:id */
export async function getOrganization(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Organization not found' })
    res.json({ data })
  } catch (err) { next(err) }
}

/* POST /api/organizations */
export async function createOrganization(req, res, next) {
  try {
const { name, type, address, contact, email, website, classes_config } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Organization name is required' })
    if (!type)         return res.status(400).json({ error: 'Organization type is required' })

    const { data, error } = await supabaseAdmin
      .from('organizations')
.insert([{
  name:           name.trim(),
  type,
  address:        address        || null,
  contact:        contact        || null,
  email:          email          || null,
  website:        website        || null,
  classes_config: classes_config || [],
  created_by:     req.user.id,
}])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: `An organization named "${name}" of type ${type} already exists` })
      throw error
    }
    res.status(201).json({ data })
  } catch (err) { next(err) }
}

/* POST /api/organizations/:id/logo — upload logo */
export async function uploadLogo(req, res, next) {
  try {
    const { id } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const ext  = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg'
    const path = `logos/${id}/logo.${ext}`

    // FIX: Remove all existing logo variants before uploading the new one.
    // This avoids leftover stale files (e.g. old .png when new upload is .jpg).
    await supabaseAdmin.storage
      .from(ORG_BUCKET)
      .remove([`logos/${id}/logo.jpg`, `logos/${id}/logo.png`, `logos/${id}/logo.webp`])

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(ORG_BUCKET)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true })
    if (uploadErr) throw uploadErr

    const { data: urlData } = supabaseAdmin.storage.from(ORG_BUCKET).getPublicUrl(path)
    const logo_url = urlData.publicUrl

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update({ logo_url })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    res.json({ data, logo_url })
  } catch (err) { next(err) }
}

/* DELETE /api/organizations/:id/logo — remove logo */
// FIX: new endpoint to handle explicit logo removal by the user
export async function removeLogo(req, res, next) {
  try {
    const { id } = req.params

    // Remove all possible logo file variants from storage
    await supabaseAdmin.storage
      .from(ORG_BUCKET)
      .remove([`logos/${id}/logo.jpg`, `logos/${id}/logo.png`, `logos/${id}/logo.webp`])

    // Clear logo_url in the database
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    res.json({ data })
  } catch (err) { next(err) }
}

/* PATCH /api/organizations/:id */
export async function updateOrganization(req, res, next) {
  try {
const { name, type, address, contact, email, website, classes_config } = req.body
    const updates = {}
    if (name    !== undefined) updates.name    = name.trim()
    if (type    !== undefined) updates.type    = type
    if (address !== undefined) updates.address = address || null
    if (contact !== undefined) updates.contact = contact || null
    if (email   !== undefined) updates.email   = email   || null
    if (website !== undefined) updates.website = website || null
    if (classes_config !== undefined) updates.classes_config = classes_config || []

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ data })
  } catch (err) { next(err) }
}

/* DELETE /api/organizations/:id */
export async function deleteOrganization(req, res, next) {
  try {
    const { id } = req.params
    // Remove logo from storage
    await supabaseAdmin.storage.from(ORG_BUCKET).remove([`logos/${id}/logo.jpg`, `logos/${id}/logo.png`, `logos/${id}/logo.webp`])
    const { error } = await supabaseAdmin.from('organizations').delete().eq('id', id)
    if (error) throw error
    res.json({ message: 'Organization deleted' })
  } catch (err) { next(err) }
}