
-- TOURS
CREATE TABLE IF NOT EXISTS public.tours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  espetaculo text,
  producao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read tours" ON public.tours FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert tours" ON public.tours FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update tours" ON public.tours FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete tours" ON public.tours FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tours_set_updated_at BEFORE UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ROADBOOKS expansion (non-destructive)
ALTER TABLE public.roadbooks
  ADD COLUMN IF NOT EXISTS tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ordem int,
  ADD COLUMN IF NOT EXISTS hotel_telefone text,
  ADD COLUMN IF NOT EXISTS hotel_site text,
  ADD COLUMN IF NOT EXISTS hotel_checkin date,
  ADD COLUMN IF NOT EXISTS hotel_checkout date,
  ADD COLUMN IF NOT EXISTS teatro_telefone text,
  ADD COLUMN IF NOT EXISTS teatro_site text,
  ADD COLUMN IF NOT EXISTS teatro_observacoes text,
  ADD COLUMN IF NOT EXISTS producao_whatsapp text,
  ADD COLUMN IF NOT EXISTS receptivo_whatsapp text,
  ADD COLUMN IF NOT EXISTS resumo_executivo text,
  ADD COLUMN IF NOT EXISTS quartos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS outros_contatos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS festival_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS documentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS automacoes jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS roadbooks_tour_id_idx ON public.roadbooks(tour_id);

-- STORAGE policies for roadbook-docs (path: <user_id>/<roadbook_id>/<file>)
CREATE POLICY "rbdocs_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'roadbook-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "rbdocs_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'roadbook-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "rbdocs_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'roadbook-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "rbdocs_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'roadbook-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Public read for documents (so signed URLs aren't strictly required on the public page)
CREATE POLICY "rbdocs_public_read" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'roadbook-docs');
