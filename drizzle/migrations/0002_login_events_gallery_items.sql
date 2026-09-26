CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  ip_address text,
  user_agent text,
  city text,
  country text,
  method text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_events_user_idx ON public.login_events(user_id, created_at DESC);
GRANT SELECT ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own logins" ON public.login_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins see all logins" ON public.login_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'campus',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active gallery" ON public.gallery_items FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage gallery" ON public.gallery_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER gallery_items_updated BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.gallery_items (title, description, image_url, category, display_order) VALUES
('School Campus','Aerial view of our beautiful campus','builtin:hero','campus',1),
('Classroom Learning','Students engaged in interactive learning','builtin:about','academics',2),
('Computer Lab','Students in our modern IT laboratory','builtin:lab','academics',3),
('Science Lab','Hands-on experiments in chemistry','builtin:science','academics',4),
('Sports Day','Students competing on the sports field','builtin:sports','sports',5),
('School Assembly','Students during awards ceremony','builtin:assembly','events',6),
('School Library','Students studying in the library','builtin:library','academics',7),
('Leadership','Our dedicated school leadership','builtin:headmaster','events',8);