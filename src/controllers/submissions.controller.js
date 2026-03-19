import { supabaseAdmin, PHOTO_BUCKET } from '../config/supabase.js'
import { submissionSchema, statusUpdateSchema, bulkStatusSchema } from '../middleware/validate.js'

/* GET /api/submissions — list all with filters (admin only) */
export async function listSubmissions(req, res, next) {
  try {
    const { school, role, status, search, sort = 'submitted_at', order = 'desc', page = 1, limit = 50 } = req.query
     const ALLOWED_SORT = ['submitted_at','name','school_name','status','role']
    const safeSort  = ALLOWED_SORT.includes(sort) ? sort : 'submitted_at'
    const safeOrder = order === 'asc' ? 'asc' : 'desc'
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200)
    const offset    = (Math.max(Number(page) || 1, 1) - 1) * safeLimit
  

    let query = supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + Number(limit) - 1)

    if (school) query = query.eq('school_name', school)
    if (role)   query = query.eq('role', role)
    if (status) query = query.eq('status', status)
    if (search) query = query.or(`name.ilike.%${search}%,school_name.ilike.%${search}%`)

    const { data, error, count } = await query
    if (error) throw error
    res.json({ data, total: count, page: Number(page), limit: Number(limit) })
  } catch (err) { next(err) }
}

/* GET /api/submissions/:id — single submission (admin only) */
export async function getSubmission(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Submission not found' })
    res.json({ data })
  } catch (err) { next(err) }
}

/* POST /api/submissions — create (public — anyone with form link) */
export async function createSubmission(req, res, next) {
  try {
    const body = submissionSchema.parse(req.body)

    /* Duplicate check */
    if (body.name && body.school_name) {
      const { data: existing } = await supabaseAdmin
        .from('submissions')
        .select('id, name')
        .eq('school_name', body.school_name)
        .ilike('name', body.name)
        .limit(1)
      if (existing?.length > 0) {
        return res.status(409).json({
          error: 'Duplicate submission',
          message: `A submission from "${body.name}" at ${body.school_name} already exists.`
        })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert([{ ...body, status: 'pending' }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ data })
  } catch (err) { next(err) }
}

/* POST /api/submissions/:id/photo — upload photo to Supabase Storage */
export async function uploadPhoto(req, res, next) {
  try {
    const { id } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const path = `submissions/${id}/photo.jpg`
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .upload(path, req.file.buffer, { contentType: 'image/jpeg', upsert: true })
    if (uploadErr) throw uploadErr

    const { data: urlData } = supabaseAdmin.storage.from(PHOTO_BUCKET).getPublicUrl(path)
    const photo_url = urlData.publicUrl

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({ photo_url })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    res.json({ data, photo_url })
  } catch (err) { next(err) }
}

/* PATCH /api/submissions/:id/status — approve or reject (admin only) */
export async function updateStatus(req, res, next) {
  try {
    const { status } = statusUpdateSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: req.user.id })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ data })
  } catch (err) { next(err) }
}

/* PATCH /api/submissions/bulk-status — bulk approve/reject (admin only) */
export async function bulkUpdateStatus(req, res, next) {
  try {
    const { ids, status } = bulkStatusSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: req.user.id })
      .in('id', ids)
      .select()
    if (error) throw error
    res.json({ data, updated: data.length })
  } catch (err) { next(err) }
}

/* DELETE /api/submissions/:id — delete (admin only) */
export async function deleteSubmission(req, res, next) {
  try {
    const { id } = req.params
    // Also delete photo from storage
    await supabaseAdmin.storage.from(PHOTO_BUCKET).remove([`submissions/${id}/photo.jpg`])
    const { error } = await supabaseAdmin.from('submissions').delete().eq('id', id)
    if (error) throw error
    res.json({ message: 'Submission deleted' })
  } catch (err) { next(err) }
}

/* GET /api/submissions/stats — dashboard stats (admin only) */
export async function getStats(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('status, school_name, role')

    if (error) throw error

    const total    = data.length
    const approved = data.filter(s => s.status === 'approved').length
    const pending  = data.filter(s => s.status === 'pending').length
    const rejected = data.filter(s => s.status === 'rejected').length
    const schools  = [...new Set(data.map(s => s.school_name))].length

    res.json({ total, approved, pending, rejected, schools })
  } catch (err) { next(err) }
}
