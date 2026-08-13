-- Tabela Padrão (Modelos por Espetáculo)
CREATE TABLE IF NOT EXISTS public.arquivos_padrao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    espetaculo_nome TEXT NOT NULL,
    nome TEXT NOT NULL,
    arquivo_url TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('partitura', 'musica')),
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Eventos (Específicos de um Evento)
CREATE TABLE IF NOT EXISTS public.arquivos_eventos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    arquivo_url TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('partitura', 'musica')),
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.arquivos_padrao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas para arquivos_padrao
CREATE POLICY "Enable all for authenticated users_padrao" ON public.arquivos_padrao AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para arquivos_eventos
CREATE POLICY "Enable all for authenticated users_eventos" ON public.arquivos_eventos AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Criar o Bucket 'midias_eventos' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('midias_eventos', 'midias_eventos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de storage para o bucket 'midias_eventos'
CREATE POLICY "Public Access midias_eventos"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'midias_eventos' );

CREATE POLICY "Authenticated Insert midias_eventos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK ( bucket_id = 'midias_eventos' );

CREATE POLICY "Authenticated Update midias_eventos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING ( bucket_id = 'midias_eventos' );

CREATE POLICY "Authenticated Delete midias_eventos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING ( bucket_id = 'midias_eventos' );
