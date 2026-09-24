ALTER TABLE public.midias_hd ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL;
