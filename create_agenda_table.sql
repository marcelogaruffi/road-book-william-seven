-- ==========================================================
-- TABELA: agenda_compromissos (Eventos Gerais, Oficinas, Ensaios, Avisos e Anotações)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.agenda_compromissos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'oficina', -- 'oficina', 'ensaio', 'reuniao', 'aviso', 'lembrete', 'anotacao'
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  local TEXT,
  cor TEXT DEFAULT '#6366f1', -- Cor da tag/badge na agenda
  
  -- Visibilidade e permissões:
  -- Se privada = true, somente o usuario_id (autor) vê
  privada BOOLEAN DEFAULT false,
  
  -- Para eventos de produção:
  -- 'todos' = visível para todos os membros
  -- 'funcoes' = visível para perfis que tenham determinadas funções (ex: ['musico', 'tecnico'])
  -- 'selecionados' = visível apenas para os usuários em destinatarios_ids
  visibilidade_tipo TEXT DEFAULT 'todos', -- 'todos', 'funcoes', 'selecionados'
  visibilidade_funcoes TEXT[] DEFAULT '{}',
  destinatarios_ids UUID[] DEFAULT '{}',
  
  -- Vínculos opcionais com espetáculo ou evento específico
  evento_id UUID,
  espetaculo TEXT,
  
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Dono caso seja nota pessoal
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agenda_compromissos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso agenda_compromissos para autenticados" ON public.agenda_compromissos;
CREATE POLICY "Acesso agenda_compromissos para autenticados"
ON public.agenda_compromissos
FOR ALL
TO authenticated
USING (
  -- O próprio criador ou dono da anotação
  auth.uid() = criado_por OR
  auth.uid() = usuario_id OR
  -- Não é privado e visível para todos
  (privada = false AND visibilidade_tipo = 'todos') OR
  -- Está expressamente na lista de destinatários
  (privada = false AND auth.uid() = ANY(destinatarios_ids)) OR
  -- Se o usuário for produtor/admin/dev
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'dev', 'produtor')
  )
)
WITH CHECK (true);
