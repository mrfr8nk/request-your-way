CREATE OR REPLACE FUNCTION public.generate_teacher_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE yr text := EXTRACT(YEAR FROM now())::text; nxt int;
BEGIN
  IF NEW.employee_id IS NOT NULL AND NEW.employee_id <> '' THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('teacher_id_seq'));
  SELECT COALESCE(MAX(CASE WHEN employee_id ~ ('^TCH' || yr || '\d{4}$') THEN SUBSTRING(employee_id FROM 8)::int ELSE 0 END), 0) + 1
    INTO nxt FROM public.teacher_profiles WHERE employee_id LIKE 'TCH' || yr || '%';
  NEW.employee_id := 'TCH' || yr || LPAD(nxt::text, 4, '0');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_generate_teacher_id ON public.teacher_profiles;
CREATE TRIGGER trg_generate_teacher_id BEFORE INSERT ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_teacher_id();
CREATE UNIQUE INDEX IF NOT EXISTS teacher_profiles_employee_id_key ON public.teacher_profiles(employee_id) WHERE employee_id IS NOT NULL AND employee_id <> '';
WITH t AS (
  SELECT id, 'TCH' || EXTRACT(YEAR FROM created_at)::text || LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::text, 4, '0') AS nid
  FROM public.teacher_profiles WHERE employee_id IS NULL OR employee_id = ''
)
UPDATE public.teacher_profiles tp SET employee_id = t.nid FROM t WHERE tp.id = t.id;
REVOKE EXECUTE ON FUNCTION public.generate_teacher_id() FROM PUBLIC, anon, authenticated;