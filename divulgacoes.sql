CREATE TABLE IF NOT EXISTS public.midias_divulgacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  espetaculo TEXT NOT NULL,
  rede_social TEXT NOT NULL,
  link TEXT NOT NULL,
  data_publicacao DATE NOT NULL,
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.midias_divulgacoes ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Permitir leitura/escrita para usuários autenticados em divulgacoes" 
ON public.midias_divulgacoes 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
