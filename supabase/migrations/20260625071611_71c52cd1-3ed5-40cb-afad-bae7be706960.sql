
DROP POLICY IF EXISTS "Anyone can read unused codes for validation" ON public.access_codes;
DROP POLICY IF EXISTS "Authenticated users can mark codes as used" ON public.access_codes;

CREATE OR REPLACE FUNCTION public.consume_access_code(_code text, _role public.app_role)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.access_codes%ROWTYPE;
  v_use_count int;
  v_max_uses int;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  SELECT * INTO v_row FROM public.access_codes WHERE code = _code AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid'); END IF;
  v_use_count := COALESCE(v_row.use_count, CASE WHEN v_row.used THEN 1 ELSE 0 END);
  v_max_uses  := COALESCE(v_row.max_uses, 1);
  IF v_use_count >= v_max_uses THEN RETURN jsonb_build_object('ok', false, 'error', 'used_up'); END IF;
  IF v_row.role <> _role THEN RETURN jsonb_build_object('ok', false, 'error', 'wrong_role'); END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN RETURN jsonb_build_object('ok', false, 'error', 'expired'); END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, _role) ON CONFLICT (user_id, role) DO NOTHING;
  UPDATE public.access_codes
     SET use_count = v_use_count + 1,
         used = (v_use_count + 1) >= v_max_uses,
         used_by = v_uid
   WHERE id = v_row.id;
  RETURN jsonb_build_object('ok', true, 'role', v_row.role);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_access_code(text, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_access_code(text, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

DROP POLICY IF EXISTS "Anyone can view own application by email" ON public.applications;
CREATE POLICY "Users can view their own application"
  ON public.applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "Anyone can lookup student by student_id for linking" ON public.student_profiles;

CREATE POLICY "Parents can view linked children profiles"
  ON public.student_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parent_student_links psl
                 WHERE psl.parent_id = auth.uid() AND psl.student_id = student_profiles.user_id));

CREATE OR REPLACE FUNCTION public.lookup_student_for_linking(_student_id text)
RETURNS TABLE(user_id uuid, full_name text, form int, level public.academic_level)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT sp.user_id, p.full_name, sp.form, sp.level
    FROM public.student_profiles sp
    LEFT JOIN public.profiles p ON p.user_id = sp.user_id
    WHERE sp.student_id = _student_id
    LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION public.lookup_student_for_linking(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_student_for_linking(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_student_to_parent(_student_id text, _parent_phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
  v_sp record;
  v_parent_last9 text := RIGHT(regexp_replace(COALESCE(_parent_phone, ''), '\D', '', 'g'), 9);
  v_guard_last9 text;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  SELECT user_id, guardian_phone, guardian_email INTO v_sp
    FROM public.student_profiles WHERE student_id = _student_id LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  v_guard_last9 := RIGHT(regexp_replace(COALESCE(v_sp.guardian_phone, ''), '\D', '', 'g'), 9);
  IF NOT (
    (LENGTH(v_parent_last9) >= 9 AND v_parent_last9 = v_guard_last9)
    OR (v_email <> '' AND v_email = LOWER(COALESCE(v_sp.guardian_email, '')))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'verification_failed');
  END IF;
  INSERT INTO public.parent_student_links (parent_id, student_id)
    VALUES (v_uid, v_sp.user_id)
    ON CONFLICT (parent_id, student_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'student_user_id', v_sp.user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.link_student_to_parent(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_student_to_parent(text, text) TO authenticated;

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Teachers view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'::public.app_role));

CREATE POLICY "Parents view linked children profiles_p"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parent_student_links psl
                 WHERE psl.parent_id = auth.uid() AND psl.student_id = profiles.user_id));

CREATE POLICY "Conversation members view each other profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() AND cp2.user_id = profiles.user_id
  ));

DROP POLICY IF EXISTS "Anyone can verify reports" ON public.report_verifications;

CREATE OR REPLACE FUNCTION public.verify_report_by_serial(_serial text)
RETURNS TABLE(
  "serial_number" text, "student_name" text, "student_code" text, "class_name" text,
  "level" text, "term" text, "academic_year" int, "average_mark" numeric,
  "subjects_count" int, "position" int, "total_students" int, "generated_at" timestamptz
) LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT rv.serial_number, rv.student_name, rv.student_code, rv.class_name, rv.level, rv.term,
         rv.academic_year, rv.average_mark, rv.subjects_count, rv.position, rv.total_students, rv.generated_at
  FROM public.report_verifications rv WHERE rv.serial_number = _serial LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_report_by_serial(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_report_by_serial(text) TO anon, authenticated;

ALTER TABLE public.staff_gallery DROP COLUMN IF EXISTS email;

DROP POLICY IF EXISTS "Anyone can read application documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload application documents" ON storage.objects;

CREATE POLICY "Applicants can upload application documents"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Admins read application documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'application-documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
CREATE POLICY "Admins read receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Anyone can view student reports" ON storage.objects;
CREATE POLICY "Owners read own student reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins and teachers read all student reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-reports'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
         OR public.has_role(auth.uid(), 'teacher'::public.app_role))
  );

CREATE POLICY "Linked parents read child student reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-reports'
    AND EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.parent_id = auth.uid()
        AND psl.student_id::text = (storage.foldername(name))[1]
    )
  );

REVOKE EXECUTE ON FUNCTION public.calculate_grade(numeric, public.academic_level) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_scholarships() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_student_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_application() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_fee_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_direct_conversation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid, text) TO authenticated;
