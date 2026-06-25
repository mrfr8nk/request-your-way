
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
CREATE POLICY "Anyone can submit applications"
  ON public.applications FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can add participants" ON public.conversation_participants;
CREATE POLICY "Authenticated can add participants"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can create conversations" ON public.conversations;
CREATE POLICY "Authenticated can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can create verifications" ON public.report_verifications;
CREATE POLICY "Authenticated can create verifications"
  ON public.report_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
