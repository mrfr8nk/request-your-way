CREATE TABLE IF NOT EXISTS public.db_heartbeat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'cron',
  beat_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.db_heartbeat TO authenticated;
GRANT ALL ON public.db_heartbeat TO service_role;

ALTER TABLE public.db_heartbeat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view heartbeat" ON public.db_heartbeat;
CREATE POLICY "Admins can view heartbeat"
ON public.db_heartbeat FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS db_heartbeat_beat_at_idx ON public.db_heartbeat (beat_at DESC);

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.record_db_heartbeat(_source text DEFAULT 'cron')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.db_heartbeat (source) VALUES (coalesce(_source, 'cron'));
  DELETE FROM public.db_heartbeat WHERE beat_at < now() - interval '30 days';
END;
$$;

REVOKE ALL ON FUNCTION public.record_db_heartbeat(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_db_heartbeat(text) TO service_role;