CREATE OR REPLACE FUNCTION public.check_student_id(_student_id text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v record;
BEGIN
  IF length(COALESCE(trim(_student_id),'')) < 6 THEN RETURN jsonb_build_object('found', false); END IF;
  SELECT sp.form, sp.level, split_part(COALESCE(pr.full_name,''),' ',1) AS first_name INTO v
    FROM public.student_profiles sp LEFT JOIN public.profiles pr ON pr.user_id = sp.user_id
    WHERE sp.student_id = upper(trim(_student_id)) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  RETURN jsonb_build_object('found', true, 'first_name', v.first_name, 'form', v.form);
END; $$;
REVOKE ALL ON FUNCTION public.check_student_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_student_id(text) TO anon, authenticated;