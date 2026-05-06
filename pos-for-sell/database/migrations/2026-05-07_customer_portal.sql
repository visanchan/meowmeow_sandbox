-- Wave 40a — Customer Portal data layer
--
-- Adds customer + pet + order-link + registration-token tables so the
-- post-purchase Customer Portal can capture customer/pet info without
-- ever blocking the cashier flow. Pet profile is the booth-seller moat
-- (per VISION.md), but it lives in this portal layer, not in checkout.
--
-- Run order assumption: schema.sql, rls-policies.sql, and any prior
-- migrations have already been applied. This file is idempotent — safe
-- to re-run; gated by `create table if not exists` and `do$$` blocks
-- around constraints/triggers.

-- ----- Tables -----

create table if not exists public.customers (
  id                       uuid primary key default gen_random_uuid(),
  workspace_id             uuid not null references public.workspaces(id) on delete cascade,
  display_name             text,
  preferred_contact_method text check (preferred_contact_method in ('phone','email','line')),
  consent_marketing        boolean not null default false,
  consent_marketing_at     timestamptz,
  registered_via           text not null default 'portal'
                             check (registered_via in ('portal','cashier','admin','import')),
  first_seen_at            timestamptz not null default now(),
  last_seen_at             timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists customers_workspace_idx on public.customers (workspace_id, last_seen_at desc);

create table if not exists public.customer_contacts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  channel       text not null check (channel in ('phone','email','line','other')),
  value         text not null check (length(value) > 0),
  is_primary    boolean not null default false,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (workspace_id, channel, value)
);
create index if not exists customer_contacts_customer_idx on public.customer_contacts (customer_id);
create index if not exists customer_contacts_lookup_idx
  on public.customer_contacts (workspace_id, channel, value);

create table if not exists public.pets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  name          text not null,
  species       text not null default 'cat'
                  check (species in ('cat','dog','rabbit','bird','other')),
  breed         text,
  weight_kg     numeric(5,2),
  birthday      date,
  adoption_day  date,
  allergies     text,
  preferences   text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists pets_customer_idx on public.pets (customer_id);

create table if not exists public.customer_order_links (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  order_id      uuid not null references public.orders(id) on delete cascade,
  linked_via    text not null default 'portal'
                  check (linked_via in ('portal','cashier','admin')),
  linked_at     timestamptz not null default now(),
  unique (customer_id, order_id)
);
create index if not exists customer_order_links_customer_idx on public.customer_order_links (customer_id);
create index if not exists customer_order_links_order_idx    on public.customer_order_links (order_id);

create table if not exists public.customer_registration_tokens (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  order_id            uuid not null references public.orders(id) on delete cascade,
  token               text not null unique,
  expires_at          timestamptz not null default (now() + interval '90 days'),
  claimed_at          timestamptz,
  claimed_customer_id uuid references public.customers(id) on delete set null,
  created_at          timestamptz not null default now(),
  created_by_user_id  uuid references auth.users(id)
);
create index if not exists customer_reg_tokens_order_idx     on public.customer_registration_tokens (order_id);
create index if not exists customer_reg_tokens_workspace_idx on public.customer_registration_tokens (workspace_id, created_at desc);

-- ----- Triggers -----

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch
  before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists pets_touch on public.pets;
create trigger pets_touch
  before update on public.pets
  for each row execute function public.touch_updated_at();
