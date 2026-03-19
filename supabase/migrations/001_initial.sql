-- ════════════════════════════════════════════════════════════════════
-- Shriram ID Cards — Supabase Database Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Enable UUID extension ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Form Configurations (generated links) ──────────────────────
CREATE TABLE IF NOT EXISTS form_configs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('Student','Staff','Employee')),
  fields      TEXT[]      NOT NULL DEFAULT '{}',
  url_id      TEXT        UNIQUE NOT NULL,   -- used in the public URL
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  expires_at  TIMESTAMPTZ,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Submissions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_config_id     UUID        REFERENCES form_configs(id) ON DELETE SET NULL,
  school_name        TEXT        NOT NULL,
  role               TEXT        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','approved','rejected')),

  -- Core fields
  name               TEXT,
  class              TEXT,
  section            TEXT,
  roll_number        TEXT,
  admission_number   TEXT,
  date_of_birth      DATE,
  contact_number     TEXT,
  emergency_contact  TEXT,
  blood_group        TEXT,
  address            TEXT,
  mode_of_transport  TEXT,
  designation        TEXT,
  department         TEXT,
  aadhar_card        TEXT,

  -- Photo stored in Supabase Storage
  photo_url          TEXT,

  -- Audit
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at        TIMESTAMPTZ,
  reviewed_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── 4. Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_submissions_school    ON submissions(school_name);
CREATE INDEX IF NOT EXISTS idx_submissions_status    ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted ON submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_configs_url_id   ON form_configs(url_id);

-- ── 5. Row Level Security ──────────────────────────────────────────
ALTER TABLE form_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions   ENABLE ROW LEVEL SECURITY;

-- form_configs: authenticated users can do everything
CREATE POLICY "Auth users manage form_configs"
  ON form_configs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- form_configs: public (anon) can READ active, non-expired configs only
CREATE POLICY "Public read active form_configs"
  ON form_configs FOR SELECT
  TO anon
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- submissions: authenticated users can do everything
CREATE POLICY "Auth users manage submissions"
  ON submissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- submissions: anyone (anon) can INSERT (submit a form)
CREATE POLICY "Anyone can submit"
  ON submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── 6. Storage Bucket ─────────────────────────────────────────────
-- Run this in Supabase Dashboard → Storage → New bucket
-- Name: id-card-photos
-- Public: true
-- Or use the SQL below:

INSERT INTO storage.buckets (id, name, public)
VALUES ('id-card-photos', 'id-card-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can upload photos
CREATE POLICY "Anyone can upload photos"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'id-card-photos');

-- Storage policy: anyone can view photos
CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'id-card-photos');

-- Storage policy: auth users can delete photos
CREATE POLICY "Auth users delete photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'id-card-photos');

-- ── 7. Seed Data (sample records for testing) ─────────────────────
-- NOTE: Replace the url_id values if you want different demo links

INSERT INTO form_configs (school_name, role, fields, url_id, is_active) VALUES
  ('Netaji School',  'Student', ARRAY['Name','ClassN','Section','RollNumber','DateofBirth','BloodGroup','ContactNumber','UploadYourPhoto','Address','EmergencyContact'], 'netaji-student-demo-001', true),
  ('Prerna College', 'Student', ARRAY['Name','ClassN','Section','RollNumber','DateofBirth','BloodGroup','ContactNumber','UploadYourPhoto','AdmissionNumber','EmergencyContact','Address'], 'prerna-student-demo-002', true),
  ('Raisoni School', 'Staff',   ARRAY['Name','Designation','Department','ContactNumber','BloodGroup','UploadYourPhoto','Address'], 'raisoni-staff-demo-003', true)
ON CONFLICT (url_id) DO NOTHING;

INSERT INTO submissions (school_name, role, status, name, class, section, roll_number, contact_number, blood_group, emergency_contact, address, date_of_birth) VALUES
  ('Netaji School',  'Student', 'approved', 'Mehek Betal',                 '6',   'B', '12',  '9075929075', 'O+',  '9975416849', 'Rameela Palace flat no 501 Umred road Nagpur', '2015-01-01'),
  ('Prerna College', 'Student', 'pending',  'Ridhima Sunil Kuhikar',        '6th', 'E', '45',  '8666340881', '',    '9860644136', 'AT POST PachgaonTah Umred Dist Nagpur',         '2014-05-16'),
  ('Raisoni School', 'Student', 'approved', 'Yash Shingne',                 '9',   'A', '22',  '',           'B+',  '',           '',                                              '2013-06-20'),
  ('Prerna College', 'Student', 'rejected', 'Yogesh Hiraman Gacchiwale',    '11',  'C', '67',  '8432709815', 'A+',  '9090909090', 'Nagpur',                                        '2012-09-15'),
  ('Prerna College', 'Student', 'pending',  'Kajal Bhowate',                '10',  'D', '33',  '7385291904', 'AB+', '8888888888', 'Nagpur',                                        '2013-11-03'),
  ('Netaji School',  'Staff',   'approved', 'Tannu Vikram Khaire',          NULL,  NULL,NULL,   '9021167497', 'O-',  NULL,         'Nagpur',                                        NULL),
  ('Prerna College', 'Student', 'pending',  'Jainab Fatema Wasim Siddiqui', '12',  'A', '89',  '7059177797', 'B-',  '9999999999', 'Nagpur',                                        '2012-02-28'),
  ('Netaji School',  'Staff',   'approved', 'Rahul Deshmukh',               NULL,  NULL,NULL,   '9876543210', 'A+',  NULL,         'Nagpur',                                        NULL);

-- ── 8. Helper function: get submission counts per config ───────────
CREATE OR REPLACE FUNCTION get_config_submission_count(config_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)::INTEGER FROM submissions WHERE form_config_id = config_id;
$$;

-- ════════════════════════════════════════════════════════════════════
-- SETUP COMPLETE ✓
-- 
-- After running this:
-- 1. Go to Supabase Auth → Users → Create new user
--    Email: admin@shriram.com  Password: password123
-- 2. Copy your Project URL and anon key from:
--    Settings → API → Project URL & Project API keys
-- 3. Create .env.local in project root:
--    VITE_SUPABASE_URL=https://YOUR_ID.supabase.co
--    VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
-- ════════════════════════════════════════════════════════════════════
