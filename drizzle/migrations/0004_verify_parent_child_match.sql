CREATE OR REPLACE FUNCTION public.verify_parent_child_match(_student_id text, _phone text, _email text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v record; p9 text; g9 text;
BEGIN
  IF COALESCE(trim(_student_id),'') = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'missing'); END IF;
  SELECT sp.guardian_phone, sp.guardian_email, split_part(COALESCE(pr.full_name,''),' ',1) AS first_name
    INTO v FROM public.student_profiles sp LEFT JOIN public.profiles pr ON pr.user_id = sp.user_id
    WHERE sp.student_id = upper(trim(_student_id)) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  p9 := RIGHT(regexp_replace(COALESCE(_phone,''),'\D','','g'),9);
  g9 := RIGHT(regexp_replace(COALESCE(v.guardian_phone,''),'\D','','g'),9);
  IF (length(p9) >= 9 AND p9 = g9) OR (COALESCE(_email,'') <> '' AND lower(trim(_email)) = lower(COALESCE(v.guardian_email,''))) THEN
    RETURN jsonb_build_object('ok', true, 'first_name', v.first_name);
  END IF;
  RETURN jsonb_build_object('ok', false, 'error', 'mismatch');
END; $$;
REVOKE ALL ON FUNCTION public.verify_parent_child_match(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_parent_child_match(text,text,text) TO anon, authenticated;