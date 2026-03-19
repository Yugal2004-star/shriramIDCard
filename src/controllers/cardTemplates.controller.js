import { supabaseAdmin } from '../config/supabase.js'

export async function listCardTemplates(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('card_templates').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json({ data })
  } catch (err) { next(err) }
}

export async function createCardTemplate(req, res, next) {
  try {
    const { name, org_id, config } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Template name is required' })
    const { data, error } = await supabaseAdmin
      .from('card_templates')
      .insert([{ name: name.trim(), org_id: org_id||null, config: config||{}, created_by: req.user.id }])
      .select().single()
    if (error) throw error
    res.status(201).json({ data })
  } catch (err) { next(err) }
}

export async function updateCardTemplate(req, res, next) {
  try {
    const { name, config, org_id } = req.body
    const updates = {}
    if (name   !== undefined) updates.name   = name.trim()
    if (config !== undefined) updates.config = config
    if (org_id !== undefined) updates.org_id = org_id
    const { data, error } = await supabaseAdmin
      .from('card_templates').update(updates).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ data })
  } catch (err) { next(err) }
}

export async function deleteCardTemplate(req, res, next) {
  try {
    const { error } = await supabaseAdmin.from('card_templates').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'Template deleted' })
  } catch (err) { next(err) }
}