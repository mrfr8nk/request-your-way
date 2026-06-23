
CREATE TABLE public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  organization_name text NOT NULL,
  coverage_type text NOT NULL DEFAULT 'full' CHECK (coverage_type IN ('full', 'partial')),
  coverage_percentage numeric NOT NULL DEFAULT 100 CHECK (coverage_percentage > 0 AND coverage_percentage <= 100),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scholarships" ON public.scholarships FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own scholarships" ON public.scholarships FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Parents can view linked children scholarships" ON public.scholarships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = scholarships.student_id)
);

-- Trigger to auto-deactivate expired scholarships
CREATE OR REPLACE FUNCTION public.deactivate_expired_scholarships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.scholarships
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND end_date IS NOT NULL AND end_date < CURRENT_DATE;
  RETURN NULL;
END;
$$;
