CREATE POLICY "Class teachers can view class grades"
ON public.grades
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = grades.class_id
    AND classes.class_teacher_id = auth.uid()
  )
);

CREATE POLICY "Class teachers can update class grades"
ON public.grades
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = grades.class_id
    AND classes.class_teacher_id = auth.uid()
  )
);

CREATE POLICY "Class teachers can insert class grades"
ON public.grades
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = grades.class_id
    AND classes.class_teacher_id = auth.uid()
  )
);