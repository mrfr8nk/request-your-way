CREATE OR REPLACE FUNCTION public.set_grade_letter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_level academic_level;
BEGIN
  SELECT level INTO v_level FROM public.classes WHERE id = NEW.class_id;
  IF v_level IS NULL THEN
    SELECT level INTO v_level FROM public.student_profiles WHERE user_id = NEW.student_id LIMIT 1;
  END IF;
  IF v_level IS NOT NULL AND NEW.mark IS NOT NULL THEN
    NEW.grade_letter := public.calculate_grade(NEW.mark, v_level);
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.set_grade_letter() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_set_grade_letter ON public.grades;
CREATE TRIGGER trg_set_grade_letter BEFORE INSERT OR UPDATE OF mark, class_id ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.set_grade_letter();
UPDATE public.grades SET mark = mark WHERE grade_letter IS NULL OR grade_letter = '';