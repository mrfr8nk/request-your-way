
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- Update existing used codes to have use_count = 1
UPDATE public.access_codes SET use_count = 1 WHERE used = true;
