-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos_tecnicos', 'documentos_tecnicos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket
CREATE POLICY "Permitir leitura publica de documentos tecnicos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documentos_tecnicos');

CREATE POLICY "Permitir upload para usuarios autenticados" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'documentos_tecnicos');

CREATE POLICY "Permitir delete para usuarios autenticados" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'documentos_tecnicos');
