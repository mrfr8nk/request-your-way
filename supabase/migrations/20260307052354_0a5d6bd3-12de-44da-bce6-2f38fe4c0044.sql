
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
