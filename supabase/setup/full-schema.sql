
-- =============================================
-- ST. MARY'S HIGH SCHOOL MANAGEMENT SYSTEM
-- Complete Database Schema
-- =============================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Academic level enum
CREATE TYPE public.academic_level AS ENUM ('zjc', 'o_level', 'a_level');

-- Attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- Term enum
CREATE TYPE public.school_term AS ENUM ('term_1', 'term_2', 'term_3');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ACCESS CODES TABLE (for teacher/student signup)
-- =============================================
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CLASSES TABLE
-- =============================================
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level academic_level NOT NULL,
  form INTEGER NOT NULL,
  stream TEXT,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  class_teacher_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SUBJECTS TABLE
-- =============================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  level academic_level,
  is_compulsory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TEACHER PROFILES (extended info)
-- =============================================
CREATE TABLE public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_id TEXT,
  department TEXT,
  qualification TEXT,
  date_joined DATE,
  subjects_taught TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STUDENT PROFILES (extended info)
-- =============================================
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  student_id TEXT UNIQUE,
  class_id UUID REFERENCES public.classes(id),
  level academic_level NOT NULL,
  form INTEGER NOT NULL,
  date_of_birth DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  address TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TEACHER-SUBJECT-CLASS ASSIGNMENTS
-- =============================================
CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id, class_id, academic_year)
);

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- GRADES TABLE
-- =============================================
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) NOT NULL,
  term school_term NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  mark NUMERIC(5,2) NOT NULL CHECK (mark >= 0 AND mark <= 100),
  grade_letter TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, term, academic_year)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  target_role app_role,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =============================================
-- GRADING SCALES TABLE
-- =============================================
CREATE TABLE public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level academic_level NOT NULL,
  grade_letter TEXT NOT NULL,
  min_mark NUMERIC(5,2) NOT NULL,
  max_mark NUMERIC(5,2) NOT NULL,
  description TEXT,
  UNIQUE(level, grade_letter)
);

ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FEE RECORDS TABLE
-- =============================================
CREATE TABLE public.fee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  term school_term NOT NULL,
  academic_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_date DATE,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_teacher_profiles_updated_at ON public.teacher_profiles;
CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON public.teacher_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_grades_updated_at ON public.grades;
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- GRADE CALCULATION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_grade(_mark NUMERIC, _level academic_level)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT grade_letter INTO result
  FROM public.grading_scales
  WHERE level = _level AND _mark >= min_mark AND _mark <= max_mark
  LIMIT 1;
  
  IF result IS NULL THEN
    -- Default grading if no scale configured
    IF _level = 'o_level' THEN
      CASE
        WHEN _mark >= 70 THEN result := 'A';
        WHEN _mark >= 60 THEN result := 'B';
        WHEN _mark >= 50 THEN result := 'C';
        WHEN _mark >= 40 THEN result := 'D';
        ELSE result := 'U';
      END CASE;
    ELSIF _level = 'a_level' THEN
      CASE
        WHEN _mark >= 76 THEN result := 'A';
        WHEN _mark >= 67 THEN result := 'B';
        WHEN _mark >= 55 THEN result := 'C';
        WHEN _mark >= 45 THEN result := 'D';
        WHEN _mark >= 35 THEN result := 'E';
        ELSE result := 'O';
      END CASE;
    ELSE -- zjc
      CASE
        WHEN _mark >= 75 THEN result := 'A';
        WHEN _mark >= 65 THEN result := 'B';
        WHEN _mark >= 50 THEN result := 'C';
        WHEN _mark >= 40 THEN result := 'D';
        ELSE result := 'U';
      END CASE;
    END IF;
  END IF;
  
  RETURN result;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: users can read all profiles, update own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles: only admins can manage, users can read own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Allow self-insert during signup (via access code)
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Access codes: admins manage, anyone can read to validate
CREATE POLICY "Admins can manage access codes" ON public.access_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read unused codes for validation" ON public.access_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can mark codes as used" ON public.access_codes FOR UPDATE TO authenticated USING (used = false);

-- Classes: viewable by all authenticated
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Subjects: viewable by all
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Teacher profiles
CREATE POLICY "Anyone can view teacher profiles" ON public.teacher_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can update own profile" ON public.teacher_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Teachers can insert own profile" ON public.teacher_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage teacher profiles" ON public.teacher_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Student profiles
CREATE POLICY "Students can view own profile" ON public.student_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view student profiles" ON public.student_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admins can view all student profiles" ON public.student_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can update own profile" ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own profile" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage student profiles" ON public.student_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Teacher assignments
CREATE POLICY "Anyone can view assignments" ON public.teacher_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage assignments" ON public.teacher_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Grades
CREATE POLICY "Students can view own grades" ON public.grades FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view grades they entered" ON public.grades FOR SELECT TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert grades" ON public.grades FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') AND auth.uid() = teacher_id);
CREATE POLICY "Teachers can update own grades" ON public.grades FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all grades" ON public.grades FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Attendance
CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view class attendance" ON public.attendance FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Teachers can mark attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Teachers can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Announcements
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can create announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') AND auth.uid() = author_id);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Grading scales
CREATE POLICY "Anyone can view grading scales" ON public.grading_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage grading scales" ON public.grading_scales FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fee records
CREATE POLICY "Students can view own fees" ON public.fee_records FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage fees" ON public.fee_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- SEED DEFAULT GRADING SCALES
-- =============================================
INSERT INTO public.grading_scales (level, grade_letter, min_mark, max_mark, description) VALUES
  ('o_level', 'A', 70, 100, 'Excellent'),
  ('o_level', 'B', 60, 69, 'Very Good'),
  ('o_level', 'C', 50, 59, 'Good'),
  ('o_level', 'D', 40, 49, 'Satisfactory'),
  ('o_level', 'U', 0, 39, 'Ungraded'),
  ('a_level', 'A', 76, 100, 'Excellent'),
  ('a_level', 'B', 67, 75, 'Very Good'),
  ('a_level', 'C', 55, 66, 'Good'),
  ('a_level', 'D', 45, 54, 'Satisfactory'),
  ('a_level', 'E', 35, 44, 'Compensatory Pass'),
  ('a_level', 'O', 0, 34, 'Ordinary'),
  ('zjc', 'A', 75, 100, 'Excellent'),
  ('zjc', 'B', 65, 74, 'Very Good'),
  ('zjc', 'C', 50, 64, 'Good'),
  ('zjc', 'D', 40, 49, 'Satisfactory'),
  ('zjc', 'U', 0, 39, 'Ungraded');

-- =============================================
-- SEED DEFAULT SUBJECTS
-- =============================================
INSERT INTO public.subjects (name, code, level, is_compulsory) VALUES
  ('Mathematics', 'MATH', NULL, true),
  ('English Language', 'ENG', NULL, true),
  ('Shona', 'SHO', NULL, false),
  ('Ndebele', 'NDE', NULL, false),
  ('History', 'HIS', NULL, false),
  ('Geography', 'GEO', NULL, false),
  ('Combined Science', 'SCI', 'o_level', false),
  ('Physics', 'PHY', NULL, false),
  ('Chemistry', 'CHE', NULL, false),
  ('Biology', 'BIO', NULL, false),
  ('Accounts', 'ACC', NULL, false),
  ('Commerce', 'COM', NULL, false),
  ('Computer Science', 'CS', NULL, false),
  ('Agriculture', 'AGR', NULL, false),
  ('Technical Graphics', 'TG', NULL, false),
  ('Food & Nutrition', 'FN', NULL, false),
  ('Fashion & Fabrics', 'FF', NULL, false),
  ('Music', 'MUS', NULL, false),
  ('Art', 'ART', NULL, false),
  ('Physical Education', 'PE', NULL, false);
INSERT INTO public.access_codes (code, role, used, created_by)
VALUES ('ADMIN2026', 'admin', false, null)
ON CONFLICT DO NOTHING;
-- Fix access_codes RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage access codes" ON public.access_codes;
DROP POLICY IF EXISTS "Anyone can read unused codes for validation" ON public.access_codes;
DROP POLICY IF EXISTS "Users can mark codes as used" ON public.access_codes;

-- Permissive policies
CREATE POLICY "Admins can manage access codes"
  ON public.access_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read unused codes for validation"
  ON public.access_codes FOR SELECT
  TO anon, authenticated
  USING (used = false);

CREATE POLICY "Authenticated users can mark codes as used"
  ON public.access_codes FOR UPDATE
  TO authenticated
  USING (used = false)
  WITH CHECK (true);

-- Re-insert ADMIN2026 code (delete first in case it exists as used)
DELETE FROM public.access_codes WHERE code = 'ADMIN2026';
INSERT INTO public.access_codes (code, role, used, expires_at)
VALUES ('ADMIN2026', 'admin', false, NULL);

-- Applications table for student enrollment applications
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  address TEXT,
  level public.academic_level NOT NULL DEFAULT 'o_level',
  form INTEGER NOT NULL DEFAULT 1,
  previous_school TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage applications" ON public.applications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit applications" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view own application by email" ON public.applications FOR SELECT TO anon, authenticated USING (true);

-- Soft delete support: add deleted_at to key tables
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.fee_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Academic sessions table for term date management
CREATE TABLE public.academic_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year INTEGER NOT NULL,
  term public.school_term NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(academic_year, term)
);

ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sessions" ON public.academic_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view sessions" ON public.academic_sessions FOR SELECT TO anon, authenticated USING (true);

-- Insert default sessions for 2025-2035
INSERT INTO public.academic_sessions (academic_year, term, start_date, end_date, is_current) VALUES
(2025, 'term_1', '2025-01-14', '2025-04-11', false),
(2025, 'term_2', '2025-05-06', '2025-07-25', false),
(2025, 'term_3', '2025-09-09', '2025-11-28', false),
(2026, 'term_1', '2026-01-13', '2026-04-10', true),
(2026, 'term_2', '2026-05-05', '2026-07-24', false),
(2026, 'term_3', '2026-09-08', '2026-11-27', false),
(2027, 'term_1', '2027-01-12', '2027-04-09', false),
(2027, 'term_2', '2027-05-04', '2027-07-23', false),
(2027, 'term_3', '2027-09-07', '2027-11-26', false),
(2028, 'term_1', '2028-01-11', '2028-04-07', false),
(2028, 'term_2', '2028-05-02', '2028-07-21', false),
(2028, 'term_3', '2028-09-05', '2028-11-24', false),
(2029, 'term_1', '2029-01-09', '2029-04-06', false),
(2029, 'term_2', '2029-05-01', '2029-07-20', false),
(2029, 'term_3', '2029-09-04', '2029-11-23', false),
(2030, 'term_1', '2030-01-14', '2030-04-12', false),
(2030, 'term_2', '2030-05-06', '2030-07-25', false),
(2030, 'term_3', '2030-09-09', '2030-11-29', false),
(2031, 'term_1', '2031-01-13', '2031-04-11', false),
(2031, 'term_2', '2031-05-05', '2031-07-25', false),
(2031, 'term_3', '2031-09-08', '2031-11-28', false),
(2032, 'term_1', '2032-01-12', '2032-04-09', false),
(2032, 'term_2', '2032-05-03', '2032-07-23', false),
(2032, 'term_3', '2032-09-06', '2032-11-26', false),
(2033, 'term_1', '2033-01-11', '2033-04-08', false),
(2033, 'term_2', '2033-05-02', '2033-07-22', false),
(2033, 'term_3', '2033-09-05', '2033-11-25', false),
(2034, 'term_1', '2034-01-10', '2034-04-07', false),
(2034, 'term_2', '2034-05-01', '2034-07-21', false),
(2034, 'term_3', '2034-09-04', '2034-11-24', false),
(2035, 'term_1', '2035-01-08', '2035-04-04', false),
(2035, 'term_2', '2035-04-29', '2035-07-18', false),
(2035, 'term_3', '2035-09-02', '2035-11-21', false);

ALTER TABLE public.fee_records ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
ALTER TABLE public.fee_records ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE public.fee_records ADD COLUMN IF NOT EXISTS zig_amount numeric DEFAULT 0;

-- Add medical/identity fields to student_profiles
ALTER TABLE public.student_profiles 
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS birth_cert_number text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS medical_conditions text,
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS emergency_phone text;

-- Create monthly_tests table
CREATE TABLE IF NOT EXISTS public.monthly_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id),
  class_id uuid NOT NULL REFERENCES public.classes(id),
  teacher_id uuid NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  academic_year integer NOT NULL DEFAULT EXTRACT(year FROM now()),
  mark numeric NOT NULL CHECK (mark >= 0 AND mark <= 100),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(student_id, subject_id, month, academic_year)
);

ALTER TABLE public.monthly_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own monthly tests" ON public.monthly_tests
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own monthly tests" ON public.monthly_tests
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Create activity_log table for teachers
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  details text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.activity_log
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON public.activity_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add target_class_id to announcements for class-specific announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_class_id uuid REFERENCES public.classes(id);

-- System settings key-value store for admin toggles
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default: reports are locked by default
INSERT INTO public.system_settings (key, value) VALUES ('reports_locked', 'true');

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Function to generate next student ID in format STM{YEAR}{4-digit-seq}
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
  new_id TEXT;
BEGIN
  -- Only generate if student_id is null
  IF NEW.student_id IS NOT NULL AND NEW.student_id != '' THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM now())::TEXT;
  
  -- Find the max sequence for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN student_id ~ ('^STM' || current_year || '\d{4}$') 
      THEN SUBSTRING(student_id FROM 8)::INT 
      ELSE 0 
    END
  ), 0) + 1
  INTO next_seq
  FROM public.student_profiles
  WHERE student_id LIKE 'STM' || current_year || '%';

  new_id := 'STM' || current_year || LPAD(next_seq::TEXT, 4, '0');
  NEW.student_id := new_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign student_id on insert
DROP TRIGGER IF EXISTS trg_generate_student_id ON public.student_profiles;
CREATE TRIGGER trg_generate_student_id
  BEFORE INSERT ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_student_id();
ALTER TABLE public.applications ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE TABLE public.petty_cash (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  payment_method TEXT DEFAULT 'cash',
  receipt_reference TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.petty_cash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage petty cash"
  ON public.petty_cash FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- Update existing used codes to have use_count = 1
UPDATE public.access_codes SET use_count = 1 WHERE used = true;

-- Add receipt_image_url to petty_cash and fee_records
ALTER TABLE public.petty_cash ADD COLUMN IF NOT EXISTS receipt_image_url text;
ALTER TABLE public.fee_records ADD COLUMN IF NOT EXISTS receipt_image_url text;

-- Create storage bucket for receipt proof images
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- Allow anyone to view receipts
CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Allow admins to delete receipts
CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));

-- Messaging tables
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  type text NOT NULL DEFAULT 'direct',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper function (tables exist now)
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT TO authenticated USING (is_conversation_member(auth.uid(), id));
CREATE POLICY "Authenticated can create conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins manage all conversations" ON public.conversations
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Participant policies
CREATE POLICY "Users can view own participations" ON public.conversation_participants
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view co-participants" ON public.conversation_participants
  FOR SELECT TO authenticated USING (is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Authenticated can add participants" ON public.conversation_participants
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins manage all participants" ON public.conversation_participants
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Message policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages
  FOR SELECT TO authenticated USING (is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Users can send messages to own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Admins manage all messages" ON public.messages
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Parent portal
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own links" ON public.parent_student_links
  FOR SELECT TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "Admins manage parent links" ON public.parent_student_links
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow conversation members to update their conversations
CREATE POLICY "Members can update conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (is_conversation_member(auth.uid(), id))
  WITH CHECK (is_conversation_member(auth.uid(), id));

-- Drop and recreate message INSERT policy to be more permissive for sender
DROP POLICY IF EXISTS "Users can send messages to own conversations" ON public.messages;
CREATE POLICY "Users can send messages to own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_direct_conversation(_recipient_id uuid, _title text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_id uuid := auth.uid();
  _existing_id uuid;
  _new_id uuid;
BEGIN
  IF _sender_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient is required';
  END IF;

  IF _recipient_id = _sender_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  SELECT c.id INTO _existing_id
  FROM public.conversations c
  JOIN public.conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = _sender_id
  JOIN public.conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = _recipient_id
  WHERE c.type = 'direct'
  LIMIT 1;

  IF _existing_id IS NOT NULL THEN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = _existing_id;
    RETURN _existing_id;
  END IF;

  _new_id := gen_random_uuid();

  INSERT INTO public.conversations (id, title, type)
  VALUES (_new_id, _title, 'direct');

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (_new_id, _sender_id), (_new_id, _recipient_id);

  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid, text) TO authenticated;

-- Add edit/delete columns to messages
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Message read receipts
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reads" ON public.message_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view reads in own conversations" ON public.message_reads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND is_conversation_member(auth.uid(), m.conversation_id)
    )
  );

-- User presence table  
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY NOT NULL,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT false
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view presence" ON public.user_presence
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence" ON public.user_presence
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Message attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments');

-- Enable realtime for message_reads and user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

CREATE TABLE public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  organization_name text NOT NULL,
  coverage_type text NOT NULL DEFAULT 'full' CHECK (coverage_type IN ('full', 'partial')),
  coverage_percentage numeric NOT NULL DEFAULT 100 CHECK (coverage_percentage > 0 AND coverage_percentage <= 100),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scholarships" ON public.scholarships FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own scholarships" ON public.scholarships FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Parents can view linked children scholarships" ON public.scholarships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = scholarships.student_id)
);

-- Trigger to auto-deactivate expired scholarships
CREATE OR REPLACE FUNCTION public.deactivate_expired_scholarships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.scholarships
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND end_date IS NOT NULL AND end_date < CURRENT_DATE;
  RETURN NULL;
END;
$$;

CREATE POLICY "Anyone can lookup student by student_id for linking" ON public.student_profiles
FOR SELECT USING (true);

-- Homepage updates/news managed by admin
CREATE TABLE public.homepage_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active updates
CREATE POLICY "Anyone can view active homepage updates"
  ON public.homepage_updates FOR SELECT
  USING (is_active = true);

-- Admins can manage
CREATE POLICY "Admins can manage homepage updates"
  ON public.homepage_updates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Staff gallery managed by admin
CREATE TABLE public.staff_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  subject TEXT,
  category TEXT NOT NULL DEFAULT 'teachers',
  image_url TEXT,
  email TEXT,
  bio TEXT,
  education TEXT,
  experience TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_gallery ENABLE ROW LEVEL SECURITY;

-- Anyone can view active staff
CREATE POLICY "Anyone can view active staff"
  ON public.staff_gallery FOR SELECT
  USING (is_active = true);

-- Admins can manage staff gallery
CREATE POLICY "Admins can manage staff gallery"
  ON public.staff_gallery FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets for staff photos and homepage images
INSERT INTO storage.buckets (id, name, public) VALUES ('staff-photos', 'staff-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('homepage-images', 'homepage-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view staff photos" ON storage.objects FOR SELECT USING (bucket_id = 'staff-photos');
CREATE POLICY "Admins can upload staff photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'staff-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete staff photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'staff-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view homepage images" ON storage.objects FOR SELECT USING (bucket_id = 'homepage-images');
CREATE POLICY "Admins can upload homepage images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'homepage-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete homepage images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'homepage-images' AND public.has_role(auth.uid(), 'admin'));


-- Fix user_roles policies: change from RESTRICTIVE to PERMISSIVE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add graduation_status to student_profiles
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS graduation_status text DEFAULT NULL;
-- Values: NULL (active), 'graduated', 'promoted'

-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add gender field to profiles table
ALTER TABLE public.profiles ADD COLUMN gender text;

-- Add gender field to student_profiles table
ALTER TABLE public.student_profiles ADD COLUMN gender text;

-- Add gender field to applications table
ALTER TABLE public.applications ADD COLUMN gender text;

-- Add is_banned column to profiles for banning accounts
ALTER TABLE public.profiles ADD COLUMN is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN banned_reason text;
ALTER TABLE public.profiles ADD COLUMN banned_at timestamp with time zone;

-- Fix classes RLS: the "Anyone can view classes" policy is RESTRICTIVE which blocks all access
-- since there are no PERMISSIVE policies. Drop and recreate as PERMISSIVE.
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
CREATE POLICY "Anyone can view classes"
  ON public.classes FOR SELECT
  USING (true);
ALTER TABLE public.applications ADD COLUMN class_id uuid REFERENCES public.classes(id) DEFAULT NULL;
-- Record books: each teacher can have multiple record books per class/subject
CREATE TABLE public.record_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id),
  subject_id uuid REFERENCES public.subjects(id),
  name text NOT NULL,
  academic_year integer NOT NULL DEFAULT EXTRACT(year FROM now()),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.record_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own record books" ON public.record_books
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Custom columns within a record book
CREATE TABLE public.record_book_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_book_id uuid NOT NULL REFERENCES public.record_books(id) ON DELETE CASCADE,
  name text NOT NULL,
  column_type text NOT NULL DEFAULT 'number',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.record_book_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via record book ownership" ON public.record_book_columns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.record_books rb WHERE rb.id = record_book_id AND (rb.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.record_books rb WHERE rb.id = record_book_id AND (rb.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

-- Cell values: one entry per student per column
CREATE TABLE public.record_book_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_book_id uuid NOT NULL REFERENCES public.record_books(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.record_book_columns(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(column_id, student_id)
);

ALTER TABLE public.record_book_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via record book ownership" ON public.record_book_entries
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.record_books rb WHERE rb.id = record_book_id AND (rb.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.record_books rb WHERE rb.id = record_book_id AND (rb.teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

CREATE TABLE public.report_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text NOT NULL UNIQUE,
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  student_code text,
  class_name text,
  level text,
  term text NOT NULL,
  academic_year integer NOT NULL,
  average_mark numeric,
  subjects_count integer,
  position integer,
  total_students integer,
  generated_by uuid,
  generated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.report_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can verify reports" ON public.report_verifications FOR SELECT USING (true);
CREATE POLICY "Authenticated can create verifications" ON public.report_verifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage verifications" ON public.report_verifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Parents can insert own links"
ON public.parent_student_links
FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());CREATE POLICY "Parents can delete own links"
ON public.parent_student_links
FOR DELETE
TO authenticated
USING (parent_id = auth.uid());
-- Allow parents to view grades of their linked children
CREATE POLICY "Parents can view linked children grades"
ON public.grades FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_student_links.parent_id = auth.uid()
    AND parent_student_links.student_id = grades.student_id
  )
);

-- Allow parents to view attendance of their linked children
CREATE POLICY "Parents can view linked children attendance"
ON public.attendance FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_student_links.parent_id = auth.uid()
    AND parent_student_links.student_id = attendance.student_id
  )
);

-- Allow parents to view fee records of their linked children
CREATE POLICY "Parents can view linked children fees"
ON public.fee_records FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_student_links.parent_id = auth.uid()
    AND parent_student_links.student_id = fee_records.student_id
  )
);

-- Allow parents to view monthly tests of their linked children
CREATE POLICY "Parents can view linked children monthly tests"
ON public.monthly_tests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_student_links.parent_id = auth.uid()
    AND parent_student_links.student_id = monthly_tests.student_id
  )
);

-- Create signatures storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Create signatures table for class teacher, head, deputy etc
CREATE TABLE public.report_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title text NOT NULL, -- e.g. 'class_teacher', 'headmaster', 'deputy_head'
  user_id uuid NOT NULL,
  signature_url text,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_title, user_id)
);

ALTER TABLE public.report_signatures ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage signatures" ON public.report_signatures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Teachers can manage their own signatures
CREATE POLICY "Teachers manage own signatures" ON public.report_signatures
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anyone authenticated can view signatures (needed for report generation)
CREATE POLICY "Authenticated can view signatures" ON public.report_signatures
  FOR SELECT TO authenticated
  USING (true);

-- Storage policies for signatures bucket
CREATE POLICY "Authenticated upload signatures" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Anyone can view signatures" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');

CREATE POLICY "Users can update own signatures" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'signatures');

CREATE POLICY "Users can delete own signatures" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'signatures');

-- Security alerts table for AI-detected suspicious activities
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text NOT NULL,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security alerts"
  ON public.security_alerts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_security_alerts_created ON public.security_alerts(created_at DESC);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_security_alerts_resolved ON public.security_alerts(is_resolved);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE TABLE public.passkey_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  device_name text DEFAULT 'My Device',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own passkeys" ON public.passkey_credentials
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Class teachers can view class grades"
ON public.grades
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = grades.class_id
    AND classes.class_teacher_id = auth.uid()
  )
);

CREATE POLICY "Class teachers can update class grades"
ON public.grades
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = grades.class_id
    AND classes.class_teacher_id = auth.uid()
  )
);

CREATE POLICY "Class teachers can insert class grades"
ON public.grades
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = grades.class_id
    AND classes.class_teacher_id = auth.uid()
  )
);
-- Add unique constraint on attendance so upsert works properly across multiple days
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_class_date_unique UNIQUE (student_id, class_id, date);

-- Create fee_payments table to track individual partial payments
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_record_id UUID NOT NULL REFERENCES public.fee_records(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  amount_usd NUMERIC NOT NULL,
  amount_original NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  receipt_number TEXT,
  receipt_image_url TEXT,
  notes TEXT,
  paid_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage fee payments" ON public.fee_payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own fee payments" ON public.fee_payments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Parents can view linked children fee payments" ON public.fee_payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_student_links.parent_id = auth.uid()
    AND parent_student_links.student_id = fee_payments.student_id
  ));

CREATE POLICY "Teachers can view fee payments" ON public.fee_payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));
-- Add document image URLs to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS birth_cert_image_url text,
ADD COLUMN IF NOT EXISTS result_slip_image_url text;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload application documents
CREATE POLICY "Anyone can upload application documents"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'application-documents');

-- Allow anyone to read application documents
CREATE POLICY "Anyone can read application documents"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'application-documents');
-- Trigger function: notify all admins when a new application is submitted
CREATE OR REPLACE FUNCTION public.notify_admins_on_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      admin_record.user_id,
      'New Student Application',
      'A new application has been submitted by ' || NEW.full_name || ' (' || NEW.email || ')',
      'info'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger on applications table
DROP TRIGGER IF EXISTS on_application_insert ON public.applications;
CREATE TRIGGER on_application_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_application();

-- Trigger function: notify admins on fee payment
CREATE OR REPLACE FUNCTION public.notify_admins_on_fee_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  student_name TEXT;
BEGIN
  SELECT full_name INTO student_name FROM public.profiles WHERE user_id = NEW.student_id LIMIT 1;
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      admin_record.user_id,
      'Fee Payment Received',
      'Payment of $' || NEW.amount_usd || ' received from ' || COALESCE(student_name, 'a student'),
      'success'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_fee_payment_insert ON public.fee_payments;
CREATE TRIGGER on_fee_payment_insert
  AFTER INSERT ON public.fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_fee_payment();

-- Trigger: notify admins when a new user signs up (profile created)
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      admin_record.user_id,
      'New User Registered',
      NEW.full_name || ' (' || COALESCE(NEW.email, '') || ') has registered an account',
      'info'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_insert ON public.profiles;
CREATE TRIGGER on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_user();
