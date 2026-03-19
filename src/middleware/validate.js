import { z } from 'zod'

/* ── Helper: accepts empty string or null → treats as null ───────── */
const nullableStr = (max = 300) =>
  z.preprocess(
    val => (val === '' || val === undefined ? null : val),
    z.string().max(max).nullable().optional()
  )

const phoneField = () =>
  z.preprocess(
    val => (val === '' || val === undefined ? null : val),
    z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit number').nullable().optional()
  )

/* ── Form Config (generate link) ─────────────────────────────────── */
export const formConfigSchema = z.object({
  school_name: z.string()
                .min(2, 'School name must be at least 2 characters')
                .max(100)
                .regex(/^[a-zA-Z0-9\s.,'-]+$/, 'School name contains invalid characters'),
  role:        z.enum(['Student', 'Staff', 'Employee']),
  fields:      z.array(z.string()).min(1, 'Select at least one field').max(15),
  expires_at:  z.preprocess(
    val => (val === '' || val === undefined ? null : val),
    z.string().datetime({ offset: true }).nullable().optional()
  ),
})

/* ── Submission ───────────────────────────────────────────────────── */
export const submissionSchema = z.object({
  form_config_id:    z.preprocess(
    val => (val === '' || val === undefined ? null : val),
    z.string().uuid().nullable().optional()
  ),
  school_name:       z.string().min(1, 'School name is required'),
  role:              z.enum(['Student', 'Staff', 'Employee']),
  name:              nullableStr(100),
  class:             nullableStr(20),
  section:           nullableStr(10),
  roll_number:       nullableStr(20),
  admission_number:  nullableStr(30),
  date_of_birth:     nullableStr(20),
  contact_number:    phoneField(),
  emergency_contact: phoneField(),
  blood_group:       z.preprocess(
    val => (val === '' || val === undefined ? null : val),
    z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-']).nullable().optional()
  ),
  address:           nullableStr(300),
  mode_of_transport: nullableStr(50),
  designation:       nullableStr(100),
  department:        nullableStr(100),
  aadhar_card:       nullableStr(20),
})

/* ── Status update ────────────────────────────────────────────────── */
export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
})

/* ── Bulk status update ───────────────────────────────────────────── */
export const bulkStatusSchema = z.object({
  ids:    z.array(z.string().uuid()).min(1, 'Provide at least one ID'),
  status: z.enum(['pending', 'approved', 'rejected']),
})