CREATE OR REPLACE FUNCTION public.lookup_email_by_id(_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email
  FROM public.profiles p
  WHERE p.user_id = (
    SELECT sp.user_id FROM public.student_profiles sp WHERE upper(sp.student_id) = upper(_id) LIMIT 1
  )
  OR p.user_id = (
    SELECT tp.user_id FROM public.teacher_profiles tp WHERE upper(tp.employee_id) = upper(_id) LIMIT 1
  )
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_email_by_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_id(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_id(text) TO authenticated;