
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  teacher_id uuid,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  academic_year integer NOT NULL DEFAULT EXTRACT(year FROM now()),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.timetable_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT ALL ON public.timetable_entries TO service_role;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view timetable" ON public.timetable_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage timetable" ON public.timetable_entries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  isbn text,
  category text,
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  cover_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view books" ON public.library_books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage books" ON public.library_books FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.library_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  borrowed_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  issued_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_loans TO authenticated;
GRANT ALL ON public.library_loans TO service_role;
ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own loans" ON public.library_loans FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Parents view child loans" ON public.library_loans FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_student_links WHERE parent_id = auth.uid() AND parent_student_links.student_id = library_loans.student_id));
CREATE POLICY "Teachers view loans" ON public.library_loans FOR SELECT TO authenticated USING (has_role(auth.uid(),'teacher'::app_role));
CREATE POLICY "Admins manage loans" ON public.library_loans FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.school_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'general',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.school_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_events TO authenticated;
GRANT ALL ON public.school_events TO service_role;
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view public events" ON public.school_events FOR SELECT USING (is_public = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins manage events" ON public.school_events FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.behavior_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  awarded_by uuid NOT NULL,
  points integer NOT NULL,
  category text NOT NULL DEFAULT 'general',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavior_points TO authenticated;
GRANT ALL ON public.behavior_points TO service_role;
ALTER TABLE public.behavior_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own points" ON public.behavior_points FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Parents view child points" ON public.behavior_points FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_student_links WHERE parent_id = auth.uid() AND parent_student_links.student_id = behavior_points.student_id));
CREATE POLICY "Teachers manage points" ON public.behavior_points FOR ALL TO authenticated USING (has_role(auth.uid(),'teacher'::app_role) OR has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'teacher'::app_role) OR has_role(auth.uid(),'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_timetable_class ON public.timetable_entries(class_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_loans_student ON public.library_loans(student_id);
CREATE INDEX IF NOT EXISTS idx_events_starts ON public.school_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_behavior_student ON public.behavior_points(student_id);
