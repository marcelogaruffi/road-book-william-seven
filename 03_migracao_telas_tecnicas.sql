-- 03_migracao_telas_tecnicas.sql
-- Este script adiciona apresentacao_id nas tabelas técnicas e vincula as linhas existentes (VERSÃO SEGURA).

DO $$ 
DECLARE 
    t_name text;
BEGIN
    -- Lista das tabelas técnicas
    FOR t_name IN 
        SELECT unnest(ARRAY[
            'arquivos_eventos', 
            'props_eventos', 
            'figurinos_eventos', 
            'mapas_som', 
            'mapas_luz', 
            'camarins_eventos', 
            'camarins_ocupantes', 
            'midias_eventos', 
            'mapas_video', 
            'checklist_eventos'
        ])
    LOOP
        -- Se a tabela existe, adicionar a coluna e fazer o UPDATE
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS apresentacao_id UUID REFERENCES public.evento_apresentacoes(id) ON DELETE CASCADE;', t_name);
            EXECUTE format('UPDATE public.%I t SET apresentacao_id = (SELECT a.id FROM public.evento_apresentacoes a WHERE a.evento_id = t.evento_id ORDER BY a.data ASC, a.horario ASC LIMIT 1) WHERE t.apresentacao_id IS NULL AND t.evento_id IS NOT NULL;', t_name);
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
