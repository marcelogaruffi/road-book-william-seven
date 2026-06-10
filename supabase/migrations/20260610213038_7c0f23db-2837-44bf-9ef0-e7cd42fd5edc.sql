
CREATE TABLE public.roadbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  espetaculo TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT,
  festival TEXT,
  data_inicial DATE,
  data_final DATE,
  hotel_nome TEXT,
  hotel_endereco TEXT,
  teatro_nome TEXT,
  teatro_endereco TEXT,
  producao_nome TEXT,
  producao_telefone TEXT,
  receptivo_nome TEXT,
  receptivo_telefone TEXT,
  programacao JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.roadbooks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadbooks TO authenticated;
GRANT ALL ON public.roadbooks TO service_role;

ALTER TABLE public.roadbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read roadbooks" ON public.roadbooks FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert" ON public.roadbooks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update" ON public.roadbooks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete" ON public.roadbooks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_roadbooks_slug ON public.roadbooks(slug);
CREATE INDEX idx_roadbooks_user ON public.roadbooks(user_id);

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_roadbooks_updated BEFORE UPDATE ON public.roadbooks
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
