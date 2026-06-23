
-- Fix access_codes RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage access codes" ON public.access_codes;
DROP POLICY IF EXISTS "Anyone can read unused codes for validation" ON public.access_codes;
DROP POLICY IF EXISTS "Users can mark codes as used" ON public.access_codes;

-- Permissive policies
CREATE POLICY "Admins can manage access codes"
  ON public.access_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read unused codes for validation"
  ON public.access_codes FOR SELECT
  TO anon, authenticated
  USING (used = false);

CREATE POLICY "Authenticated users can mark codes as used"
  ON public.access_codes FOR UPDATE
  TO authenticated
  USING (used = false)
  WITH CHECK (true);

-- Re-insert ADMIN2025 code (delete first in case it exists as used)
DELETE FROM public.access_codes WHERE code = 'ADMIN2025';
INSERT INTO public.access_codes (code, role, used, expires_at)
VALUES ('ADMIN2025', 'admin', false, NULL);
