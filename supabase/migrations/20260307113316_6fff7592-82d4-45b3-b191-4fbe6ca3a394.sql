
-- Homepage updates/news managed by admin
CREATE TABLE public.homepage_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active updates
CREATE POLICY "Anyone can view active homepage updates"
  ON public.homepage_updates FOR SELECT
  USING (is_active = true);

-- Admins can manage
CREATE POLICY "Admins can manage homepage updates"
  ON public.homepage_updates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Staff gallery managed by admin
CREATE TABLE public.staff_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  subject TEXT,
  category TEXT NOT NULL DEFAULT 'teachers',
  image_url TEXT,
  email TEXT,
  bio TEXT,
  education TEXT,
  experience TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_gallery ENABLE ROW LEVEL SECURITY;

-- Anyone can view active staff
CREATE POLICY "Anyone can view active staff"
  ON public.staff_gallery FOR SELECT
  USING (is_active = true);

-- Admins can manage staff gallery
CREATE POLICY "Admins can manage staff gallery"
  ON public.staff_gallery FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets for staff photos and homepage images
INSERT INTO storage.buckets (id, name, public) VALUES ('staff-photos', 'staff-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('homepage-images', 'homepage-images', true);

-- Storage policies
CREATE POLICY "Anyone can view staff photos" ON storage.objects FOR SELECT USING (bucket_id = 'staff-photos');
CREATE POLICY "Admins can upload staff photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'staff-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete staff photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'staff-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view homepage images" ON storage.objects FOR SELECT USING (bucket_id = 'homepage-images');
CREATE POLICY "Admins can upload homepage images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'homepage-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete homepage images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'homepage-images' AND public.has_role(auth.uid(), 'admin'));
