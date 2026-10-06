CREATE TABLE IF NOT EXISTS public.catering_padrao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  espetaculo_nome TEXT NOT NULL,
  produto TEXT NOT NULL,
  quantidade NUMERIC,
  unidade TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.catering_padrao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.catering_padrao;
CREATE POLICY "Enable all for authenticated users" ON public.catering_padrao FOR ALL TO authenticated USING (true) WITH CHECK (true);
