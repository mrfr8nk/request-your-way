
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
