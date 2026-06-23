CREATE POLICY "Parents can delete own links"
ON public.parent_student_links
FOR DELETE
TO authenticated
USING (parent_id = auth.uid());