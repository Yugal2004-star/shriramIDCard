import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl         = process.env.SUPABASE_URL
const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey     = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

/* Admin client — bypasses RLS, used for server-side operations */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

/* Anon client — respects RLS, used for auth verification */
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

export const PHOTO_BUCKET = 'id-card-photos'
