-- Wave 39a — Add event_inventory.sample_qty
--
-- Adds a persistent, event-long sample-stock bucket per product. Samples are
-- units physically on display at the booth: they reduce sellable booth stock
-- but do not return to warehouse. This mirrors the meowmeow Batch DD refactor
-- on the single-file POS, where the per-day sample model surfaced a
-- visibility / double-count bug at a real Pet Expo event.
--
-- Idempotent: safe to run multiple times against the same DB.
-- Apply against an existing dev DB after schema.sql has been applied:
--   psql ... -f database/migrations/2026-05-07_add_sample_qty.sql

alter table if exists public.event_inventory
  add column if not exists sample_qty int not null default 0;

-- Add the check constraint only if it doesn't already exist. PostgreSQL
-- doesn't have IF NOT EXISTS for constraints, so we wrap in a DO block.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'event_inventory_sample_qty_check'
  ) then
    alter table public.event_inventory
      add constraint event_inventory_sample_qty_check check (sample_qty >= 0);
  end if;
end $$;

-- Sanity: every existing row should have sample_qty = 0 by default already.
-- Surface a notice if anything slipped through (paranoia; should be no-op).
do $$
declare
  v_negative int;
begin
  select count(*) into v_negative
    from public.event_inventory where sample_qty < 0;
  if v_negative > 0 then
    raise notice 'event_inventory: % rows have negative sample_qty (should not happen)', v_negative;
  end if;
end $$;
