
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
