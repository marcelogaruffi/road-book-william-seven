-- Criação da tabela para o HD Virtual (Sessão de Fotos e Links)
CREATE TABLE IF NOT EXISTS public.midias_hd (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    espetaculo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'link' ou 'upload'
    url TEXT NOT NULL,
    provedor TEXT, -- 'drive', 'dropbox', 'icloud', 'supabase', etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.midias_hd ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para midias_hd (leitura e escrita livre para simplificar, ajuste conforme necessário)
CREATE POLICY "Leitura livre para midias_hd" ON public.midias_hd FOR SELECT USING (true);
CREATE POLICY "Escrita livre para midias_hd" ON public.midias_hd FOR INSERT WITH CHECK (true);
CREATE POLICY "Edição livre para midias_hd" ON public.midias_hd FOR UPDATE USING (true);
CREATE POLICY "Exclusão livre para midias_hd" ON public.midias_hd FOR DELETE USING (true);

-- Criar o bucket de storage para os uploads de mídias (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('midias', 'midias', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para permitir uploads no bucket 'midias'
CREATE POLICY "Public Access for midias bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'midias');

CREATE POLICY "Upload Access for midias bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'midias');

CREATE POLICY "Delete Access for midias bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'midias');
