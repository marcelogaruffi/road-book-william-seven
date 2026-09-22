ALTER TABLE public.estoque_global ADD COLUMN IF NOT EXISTS merch JSONB NOT NULL DEFAULT '{}'::jsonb;
