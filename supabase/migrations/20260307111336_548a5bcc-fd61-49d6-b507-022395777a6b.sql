
CREATE POLICY "Anyone can lookup student by student_id for linking" ON public.student_profiles
FOR SELECT USING (true);
