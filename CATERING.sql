CREATE TABLE IF NOT EXISTS public.catering_eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 1,
  produto TEXT NOT NULL,
  quantidade NUMERIC,
  unidade TEXT,
  camarins JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.catering_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.catering_eventos;
CREATE POLICY "Enable all for authenticated users" ON public.catering_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);

