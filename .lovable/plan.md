
# Road Book William Seven — v2.0

Evolução grande e dividida em fases. Mantém compatibilidade total com os Road Books já criados (todos os novos campos são opcionais/JSONB e a estrutura antiga continua válida).

## 1. Banco de dados (migração única)

**Tabela `tours` (nova)**
- `id`, `user_id`, `nome`, `espetaculo`, `producao`, `created_at`, `updated_at`
- RLS: dono gerencia, leitura pública (para road book geral da turnê)
- GRANTs padrão (authenticated CRUD, anon SELECT, service_role ALL)

**Tabela `roadbooks` (alterada — só ADD COLUMN, nada destrutivo)**
- `tour_id uuid` (FK opcional → tours)
- `ordem int` (posição na turnê)
- Hotel expandido: `hotel_telefone`, `hotel_site`, `hotel_checkin date`, `hotel_checkout date`
- Teatro expandido: `teatro_telefone`, `teatro_site`, `teatro_observacoes`
- Contatos expandidos: `producao_whatsapp`, `receptivo_whatsapp`
- JSONB novos (default `[]` / `{}`):
  - `quartos jsonb` — [{ pessoa, numero }]
  - `outros_contatos jsonb` — [{ nome, funcao, telefone, whatsapp }]
  - `festival_info jsonb` — { site, instagram, redes[], programacao_oficial, observacoes }
  - `documentos jsonb` — [{ nome, url, tipo, path }]
  - `resumo_executivo text`
  - `automacoes jsonb` — { clima, farmacia, mercado, restaurantes, hospital } (placeholder vazio)
- `programacao` continua JSONB; novos itens passam a ter `{ data, hora_inicio, hora_fim, titulo, tipo, local, observacao }`. Itens antigos (`hora`, `atividade`) seguem sendo lidos por fallback no render.

**Storage**
- Bucket `roadbook-docs` (privado). Upload por usuários autenticados; leitura pública via signed URL gerada no render. Policies escopadas por `user_id` no path.

## 2. Formulário de Road Book

`RoadbookForm.tsx` reorganizado em abas/seções (shadcn Tabs) para caber tudo sem virar um scroll infinito:
1. Geral — espetáculo, cidade/UF, festival, datas, resumo executivo, **turnê (select opcional)**
2. Hotel — campos expandidos + lista dinâmica de quartos
3. Teatro — campos expandidos
4. Contatos — produção, receptivo, lista dinâmica de "outros contatos"
5. Programação — itens com hora_inicio/hora_fim, tipo (select), título
6. Festival — site, instagram, redes, programação oficial, observações (tudo opcional)
7. Documentos — upload PDF/imagem para o bucket, lista com remover

Validação leve: espetáculo e cidade continuam obrigatórios.

## 3. Duplicar Road Book

Botão "Duplicar" na lista (dashboard). Abre dialog pedindo:
- Novo espetáculo (default: "<original> (cópia)")
- Nova cidade
- Nova data inicial / final

Insere registro novo copiando todos os campos (inclui JSONB), gera novo slug, redireciona para `/roadbook/$id` para edição.

## 4. Turnês

Novas rotas:
- `/_authenticated/tours` — lista de turnês + botão "Nova turnê"
- `/_authenticated/tour/new` e `/_authenticated/tour/$id` — formulário (nome, espetáculo, produção) e tabela de road books vinculados, com "Adicionar cidade" (cria roadbook já com `tour_id`)
- Link no header do dashboard

Público:
- `/turne/$slug` — Road Book Geral da turnê: capa + lista de cidades (cards linkando para `/rb/<slug>` de cada uma) + cronograma consolidado.
- `/rb/$slug` continua sendo o road book por cidade.

Dashboard ganha aba/secção separada listando turnês.

## 5. Página pública `/rb/$slug` — nova ordem

Seções (com âncoras e índice fixo no mobile):
1. Capa (espetáculo, cidade, datas, festival se houver)
2. Resumo executivo (se preenchido)
3. Clima — placeholder "em breve" (espaço reservado, lê `automacoes.clima`)
4. Cronograma — visão compacta dia a dia (timeline)
5. Programação diária — agrupada por data, mostra tipo com badge colorido
6. Hospedagem — hotel + quartos
7. Local principal — teatro
8. Contatos — produção, receptivo, outros (com links tel:/wa.me/)
9. Festival e comunicação — só renderiza se algo preenchido
10. Documentos — links para arquivos (signed URLs)

Tudo responsivo, mobile-first, tipografia limpa.

## 6. Compatibilidade

- Todos os novos campos são opcionais/JSONB default vazio → road books antigos abrem normalmente.
- Render do form e da página pública faz fallback: programação antiga (`hora`/`atividade`) é exibida e migrada in-place ao salvar.
- Slug, auth, URLs públicas existentes — inalterados.

## 7. Automações futuras (apenas estrutura)

JSONB `automacoes` com chaves vazias para clima/farmácia/mercado/restaurantes/hospital. Tabela `tours` já preparada. Geração de PDF: nada implementado, mas página pública usa estrutura semântica que facilita futura conversão.

---

### Fora do escopo desta entrega
- Geração real de PDF
- Integração real com APIs de clima / Google Places
- Editor drag-and-drop de programação

### Detalhes técnicos
- Migração única via supabase--migration (ADD COLUMN IF NOT EXISTS + nova tabela + GRANTs + RLS + bucket policies).
- Tipos Supabase regenerados após aprovação da migração; só depois eu escrevo o código que usa os novos campos.
- Upload de documentos via `supabase.storage.from('roadbook-docs').upload(...)` direto do browser (RLS por path `${user_id}/...`).
- Sem novos pacotes npm.

Posso prosseguir?
