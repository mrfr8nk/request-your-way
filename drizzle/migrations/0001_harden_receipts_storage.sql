DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "finance staff upload receipts" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND public.is_finance_staff(auth.uid()));
DROP POLICY IF EXISTS "finance staff read receipts" ON storage.objects;
CREATE POLICY "finance staff read receipts" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND public.can_view_finance(auth.uid()));