
-- Fix classes RLS: the "Anyone can view classes" policy is RESTRICTIVE which blocks all access
-- since there are no PERMISSIVE policies. Drop and recreate as PERMISSIVE.
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
CREATE POLICY "Anyone can view classes"
  ON public.classes FOR SELECT
  USING (true);
