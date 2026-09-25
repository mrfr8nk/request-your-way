CREATE TABLE public.staff_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position text NOT NULL CHECK (position IN ('bursar','headmaster')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, position)
);
GRANT SELECT, INSERT, DELETE ON public.staff_positions TO authenticated;
GRANT ALL ON public.staff_positions TO service_role;
ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read positions" ON public.staff_positions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert positions" ON public.staff_positions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete positions" ON public.staff_positions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.has_position(_user_id uuid, _position text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff_positions WHERE user_id = _user_id AND position = _position)
$$;
CREATE OR REPLACE FUNCTION public.is_finance_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR public.has_position(_user_id,'bursar')
$$;
CREATE OR REPLACE FUNCTION public.can_view_finance(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_finance_staff(_user_id) OR public.has_position(_user_id,'headmaster')
$$;
REVOKE EXECUTE ON FUNCTION public.has_position(uuid,text), public.is_finance_staff(uuid), public.can_view_finance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_position(uuid,text), public.is_finance_staff(uuid), public.can_view_finance(uuid) TO authenticated;

CREATE TABLE public.fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount numeric NOT NULL DEFAULT 0,
  level academic_level,
  form integer,
  term school_term,
  academic_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int,
  is_optional boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_items TO authenticated;
GRANT ALL ON public.fee_items TO service_role;
ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read fee items" ON public.fee_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "finance manage fee items" ON public.fee_items FOR ALL TO authenticated USING (public.is_finance_staff(auth.uid())) WITH CHECK (public.is_finance_staff(auth.uid()));

CREATE TABLE public.payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_record_id uuid REFERENCES public.fee_records(id) ON DELETE SET NULL,
  student_id uuid NOT NULL,
  submitted_by uuid NOT NULL DEFAULT auth.uid(),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  reference text,
  proof_path text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payment_submissions TO authenticated;
GRANT ALL ON public.payment_submissions TO service_role;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submitter or finance read" ON public.payment_submissions FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR student_id = auth.uid() OR public.can_view_finance(auth.uid()));
CREATE POLICY "parent or student submit" ON public.payment_submissions FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND status = 'pending' AND (student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parent_student_links l WHERE l.parent_id = auth.uid() AND l.student_id = payment_submissions.student_id)));
CREATE POLICY "finance review" ON public.payment_submissions FOR UPDATE TO authenticated
  USING (public.is_finance_staff(auth.uid())) WITH CHECK (public.is_finance_staff(auth.uid()));

CREATE POLICY "users upload own proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = 'proofs' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "users read own proofs or finance" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (((storage.foldername(name))[1] = 'proofs' AND (storage.foldername(name))[2] = auth.uid()::text) OR public.can_view_finance(auth.uid())));

CREATE POLICY "finance staff read fee records" ON public.fee_records FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "bursar manage fee records" ON public.fee_records FOR ALL TO authenticated USING (public.is_finance_staff(auth.uid())) WITH CHECK (public.is_finance_staff(auth.uid()));
CREATE POLICY "finance staff read fee payments" ON public.fee_payments FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "bursar insert fee payments" ON public.fee_payments FOR INSERT TO authenticated WITH CHECK (public.is_finance_staff(auth.uid()));