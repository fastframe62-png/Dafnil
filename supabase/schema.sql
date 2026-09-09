-- ==============================================================================
-- DAFNIL (Aplikasi Penilaian Siswa SD) - SUPABASE DATABASE SCHEMA
-- Jalankan script SQL ini pada menu "SQL Editor" di dashboard Supabase Anda.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL IDENTITAS SEKOLAH & PENGATURAN APLIKASI
CREATE TABLE IF NOT EXISTS app_identity (
    id TEXT PRIMARY KEY DEFAULT 'default',
    nama_sekolah TEXT DEFAULT 'SD NEGERI 01 UPT',
    npsn TEXT DEFAULT '10802931',
    nama_guru TEXT DEFAULT 'Ahmad Fauzan, S.Pd.',
    nip_guru TEXT DEFAULT '19880512 201402 1 003',
    nama_kepala_sekolah TEXT DEFAULT 'Drs. H. Mulyadi, M.Pd.',
    nip_kepala_sekolah TEXT DEFAULT '19700315 199503 1 001',
    mata_pelajaran TEXT DEFAULT 'Bahasa Indonesia',
    tahun_pelajaran TEXT DEFAULT '2026/2027',
    custom_icon TEXT DEFAULT '🏫',
    nav_icons JSONB DEFAULT '{"dashboard":"🏠","siswa":"👨‍🎓","penilaian":"📝","rekap":"📊","pengaturan":"⚙️"}'::jsonb,
    home_config JSONB DEFAULT '{"greetingTitle":"Selamat Datang, Guru 👋","greetingSub":"","quoteText":"Mendidik dengan hati, menginspirasi dengan keteladanan ✨","bannerTheme":"indigo","customBannerUrl":"","showProgress":true,"showMetrics":true,"showExportBtn":true,"showQuickActions":true,"showInfoCard":false}'::jsonb,
    theme_mode TEXT DEFAULT 'dark',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL ROMBEL KELAS (Kelas 4, 5, 6)
CREATE TABLE IF NOT EXISTS app_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL SISWA
CREATE TABLE IF NOT EXISTS app_students (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES app_classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_class ON app_students(class_id);

-- 5. TABEL LINGKUP MATERI & TUJUAN PEMBELAJARAN (8 LM x 4 TP)
CREATE TABLE IF NOT EXISTS app_curriculum (
    lm_index INTEGER PRIMARY KEY, -- 0 sampai 7 (LM 1 s/d LM 8)
    name TEXT NOT NULL,
    tps JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL NILAI SISWA (Mendukung TP 1 s/d TP 4 dan Nilai Sumatif LM)
CREATE TABLE IF NOT EXISTS app_grades (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    class_id TEXT NOT NULL REFERENCES app_classes(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    student_id TEXT NOT NULL REFERENCES app_students(id) ON DELETE CASCADE,
    lm_index INTEGER NOT NULL CHECK (lm_index BETWEEN 0 AND 7),
    tp_index INTEGER NOT NULL CHECK (tp_index BETWEEN 0 AND 4), -- 0..3: TP 1-4, 4: Nilai Sumatif LM
    score NUMERIC(5,2) CHECK (score BETWEEN 0 AND 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_grade_slot UNIQUE (class_id, semester, student_id, lm_index, tp_index)
);

-- Pembaruan constraint otomatis jika tabel app_grades sudah pernah dibuat dengan constraint lama (0..3):
DO $$
BEGIN
    ALTER TABLE app_grades DROP CONSTRAINT IF EXISTS app_grades_tp_index_check;
    ALTER TABLE app_grades ADD CONSTRAINT app_grades_tp_index_check CHECK (tp_index BETWEEN 0 AND 4);
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Pembaruan kolom home_config dan theme_mode di app_identity jika sudah ada tabel sebelumnya:
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_identity') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_identity' AND column_name = 'home_config') THEN
            ALTER TABLE app_identity ADD COLUMN home_config JSONB DEFAULT '{"greetingTitle":"Selamat Datang, Guru 👋","greetingSub":"","quoteText":"Mendidik dengan hati, menginspirasi dengan keteladanan ✨","bannerTheme":"indigo","customBannerUrl":"","showProgress":true,"showMetrics":true,"showExportBtn":true,"showQuickActions":true,"showInfoCard":false}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_identity' AND column_name = 'theme_mode') THEN
            ALTER TABLE app_identity ADD COLUMN theme_mode TEXT DEFAULT 'dark';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_grades_lookup ON app_grades(class_id, semester, student_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & GRANTS
-- Memastikan token anon key memiliki izin penuh untuk SELECT, INSERT, UPDATE, DELETE
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER TABLE app_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_grades ENABLE ROW LEVEL SECURITY;

-- Policy untuk app_identity
DROP POLICY IF EXISTS "Allow public all on app_identity" ON app_identity;
DROP POLICY IF EXISTS "Allow all on app_identity" ON app_identity;
CREATE POLICY "Allow all on app_identity" ON app_identity FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy untuk app_classes
DROP POLICY IF EXISTS "Allow public all on app_classes" ON app_classes;
DROP POLICY IF EXISTS "Allow all on app_classes" ON app_classes;
CREATE POLICY "Allow all on app_classes" ON app_classes FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy untuk app_students
DROP POLICY IF EXISTS "Allow public all on app_students" ON app_students;
DROP POLICY IF EXISTS "Allow all on app_students" ON app_students;
CREATE POLICY "Allow all on app_students" ON app_students FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy untuk app_curriculum
DROP POLICY IF EXISTS "Allow public all on app_curriculum" ON app_curriculum;
DROP POLICY IF EXISTS "Allow all on app_curriculum" ON app_curriculum;
CREATE POLICY "Allow all on app_curriculum" ON app_curriculum FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy untuk app_grades
DROP POLICY IF EXISTS "Allow public all on app_grades" ON app_grades;
DROP POLICY IF EXISTS "Allow all on app_grades" ON app_grades;
CREATE POLICY "Allow all on app_grades" ON app_grades FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- DATA AWAL (SEED DEFAULT)
-- ==============================================================================

INSERT INTO app_identity (id, nama_sekolah, npsn, nama_guru, nip_guru, nama_kepala_sekolah, nip_kepala_sekolah, mata_pelajaran, tahun_pelajaran)
VALUES (
    'default',
    'SD NEGERI 01 UPT',
    '10802931',
    'Ahmad Fauzan, S.Pd.',
    '19880512 201402 1 003',
    'Drs. H. Mulyadi, M.Pd.',
    '19700315 199503 1 001',
    'Bahasa Indonesia',
    '2026/2027'
) ON CONFLICT (id) DO NOTHING;

-- Rombel bawaan
INSERT INTO app_classes (id, name, level) VALUES
('kelas_4_utsman', 'Kelas 4 Utsman', '4'),
('kelas_5_umar', 'Kelas 5 Umar', '5'),
('kelas_5_hasan', 'Kelas 5 Hasan', '5'),
('kelas_5_jafar', 'Kelas 5 Jafar', '5'),
('kelas_6_ali', 'Kelas 6 Ali', '6'),
('kelas_6_abubakar', 'Kelas 6 Abu Bakar', '6')
ON CONFLICT (id) DO NOTHING;

-- Curriculum bawaan (8 LM)
INSERT INTO app_curriculum (lm_index, name, tps) VALUES
(0, 'Lingkup Materi 1', '["TP 1: Membaca & Memahami Teks", "TP 2: Menemukan Ide Pokok", "TP 3: Menyusun Paragraf", "TP 4: Kosa Kata Baru"]'::jsonb),
(1, 'Lingkup Materi 2', '["TP 1: Menulis Surat Pribadi", "TP 2: Penggunaan Tanda Baca", "TP 3: Menceritakan Kembali", "TP 4: Presentasi Lisan"]'::jsonb),
(2, 'Lingkup Materi 3', '["TP 1: Puisi & Majas", "TP 2: Membaca Indah", "TP 3: Menulis Puisi Bebas", "TP 4: Apresiasi Sastra"]'::jsonb),
(3, 'Lingkup Materi 4', '["TP 1: Teks Prosedur", "TP 2: Langkah Kegiatan", "TP 3: Bahasa Petunjuk", "TP 4: Praktik Mandiri"]'::jsonb),
(4, 'Lingkup Materi 5', '["TP 1: Teks Narasi Sejarah", "TP 2: Tokoh & Penokohan", "TP 3: Alur Cerita", "TP 4: Amanat Cerita"]'::jsonb),
(5, 'Lingkup Materi 6', '["TP 1: Teks Eksplanasi", "TP 2: Sebab & Akibat", "TP 3: Istilah Ilmiah", "TP 4: Rangkuman Teks"]'::jsonb),
(6, 'Lingkup Materi 7', '["TP 1: Surat Resmi & Dinas", "TP 2: Format & Komponen", "TP 3: Bahasa Efektif", "TP 4: Simulasi Kirim"]'::jsonb),
(7, 'Lingkup Materi 8', '["TP 1: Karya Tulis Sederhana", "TP 2: Pengumpulan Data", "TP 3: Penyuntingan Draf", "TP 4: Publikasi Karya"]'::jsonb)
ON CONFLICT (lm_index) DO NOTHING;
