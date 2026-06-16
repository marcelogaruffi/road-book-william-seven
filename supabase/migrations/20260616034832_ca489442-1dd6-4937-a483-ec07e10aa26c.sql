
ALTER TABLE public.roadbooks
  ADD COLUMN IF NOT EXISTS hotel_checkin_hora text,
  ADD COLUMN IF NOT EXISTS hotel_checkout_hora text,
  ADD COLUMN IF NOT EXISTS voo_ida jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS voo_volta jsonb NOT NULL DEFAULT '{}'::jsonb;
