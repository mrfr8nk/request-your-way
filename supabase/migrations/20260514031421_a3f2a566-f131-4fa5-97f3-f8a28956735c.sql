
INSERT INTO storage.buckets (id, name, public) VALUES ('student-reports', 'student-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Anyone can view student reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-reports');

CREATE POLICY "Students can upload own reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students can update own reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students can delete own reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
