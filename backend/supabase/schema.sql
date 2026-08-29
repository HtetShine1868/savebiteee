-- Food Waste Solver — Phase 1 schema
-- Run this in the Supabase SQL Editor (once per project).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Accounts live here. Supabase is used as the database only: the Express API
-- owns registration, password hashing and JWT issuing (see src/routes/auth.js).
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text,
  auth_provider text not null default 'password',
  role text not null check (role in ('customer', 'owner')),
  full_name text,
  avatar_url text,
  city text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key
  on public.profiles (lower(email));

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  profile_image_url text,
  cover_image_url text,
  address text,
  city text,
  latitude double precision,
  longitude double precision,
  contact_phone text,
  contact_email text,
  categories text[] not null default '{}',
  opening_hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  product_name text not null,
  description text,
  image_url text,
  original_price numeric(12, 2) not null check (original_price >= 0),
  promo_price numeric(12, 2) not null check (promo_price >= 0),
  quantity_available integer not null check (quantity_available >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  food_expires_at timestamptz,
  pickup_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (promo_price <= original_price),
  check (ends_at > starts_at)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status text not null check (status in ('reserved', 'picked_up', 'cancelled', 'expired')),
  pickup_code text,
  pickup_by timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Short code the customer shows at the counter.
alter table public.reservations
  add column if not exists pickup_code text;

create unique index if not exists reservations_pickup_code_key
  on public.reservations (pickup_code);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists shops_updated_at on public.shops;
create trigger shops_updated_at
before update on public.shops
for each row execute function public.set_updated_at();

drop trigger if exists promotions_updated_at on public.promotions;
create trigger promotions_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists reservations_updated_at on public.reservations;
create trigger reservations_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists shops_owner_id_idx on public.shops (owner_id);
create index if not exists shops_city_idx on public.shops (city);
create index if not exists promotions_shop_id_idx on public.promotions (shop_id);
create index if not exists promotions_category_id_idx on public.promotions (category_id);
create index if not exists promotions_starts_ends_idx on public.promotions (starts_at, ends_at);
create index if not exists promotions_promo_price_idx on public.promotions (promo_price);
create index if not exists reservations_customer_id_idx on public.reservations (customer_id);
create index if not exists reservations_promotion_id_idx on public.reservations (promotion_id);
create index if not exists reservations_status_idx on public.reservations (status);

-- ---------------------------------------------------------------------------
-- Listing view (status is computed, never stored)
-- ---------------------------------------------------------------------------

create or replace view public.promotion_listings
with (security_invoker = true)
as
select
  p.id,
  p.shop_id,
  p.category_id,
  p.product_name,
  p.description,
  p.image_url,
  p.original_price,
  p.promo_price,
  p.quantity_available,
  p.starts_at,
  p.ends_at,
  p.food_expires_at,
  p.pickup_location,
  p.created_at,
  p.updated_at,
  s.owner_id as shop_owner_id,
  s.name as shop_name,
  s.slug as shop_slug,
  s.city as shop_city,
  s.address as shop_address,
  s.latitude as shop_latitude,
  s.longitude as shop_longitude,
  s.profile_image_url as shop_image_url,
  s.contact_phone as shop_phone,
  c.name as category_name,
  c.slug as category_slug,
  case
    when p.quantity_available <= 0 then 'sold_out'
    when now() < p.starts_at then 'upcoming'
    when now() > p.ends_at
      or (p.food_expires_at is not null and now() > p.food_expires_at)
      then 'expired'
    else 'active'
  end as status
from public.promotions p
join public.shops s on s.id = p.shop_id
left join public.categories c on c.id = p.category_id;

-- ---------------------------------------------------------------------------
-- Safe stock functions (row locks prevent negative quantity)
-- ---------------------------------------------------------------------------

create or replace function public.reserve_promotion(
  p_promotion_id uuid,
  p_customer_id uuid,
  p_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo public.promotions;
  v_reservation public.reservations;
  v_code text;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select * into v_promo
  from public.promotions
  where id = p_promotion_id
  for update;

  if not found then
    raise exception 'PROMOTION_NOT_FOUND';
  end if;

  if now() < v_promo.starts_at then
    raise exception 'PROMOTION_NOT_STARTED';
  end if;

  if now() > v_promo.ends_at
     or (v_promo.food_expires_at is not null and now() > v_promo.food_expires_at) then
    raise exception 'PROMOTION_EXPIRED';
  end if;

  if v_promo.quantity_available < p_quantity then
    raise exception 'INSUFFICIENT_QUANTITY';
  end if;

  update public.promotions
  set quantity_available = quantity_available - p_quantity
  where id = p_promotion_id;

  -- md5/random are built in, so this works regardless of where pgcrypto lives.
  loop
    v_code := 'FWS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
    exit when not exists (
      select 1 from public.reservations where pickup_code = v_code
    );
  end loop;

  insert into public.reservations (
    promotion_id,
    customer_id,
    quantity,
    status,
    pickup_code,
    pickup_by
  )
  values (
    p_promotion_id,
    p_customer_id,
    p_quantity,
    'reserved',
    v_code,
    v_promo.ends_at
  )
  returning * into v_reservation;

  return to_jsonb(v_reservation);
end;
$$;

create or replace function public.cancel_reservation(
  p_reservation_id uuid,
  p_customer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  select * into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if v_reservation.customer_id <> p_customer_id then
    raise exception 'FORBIDDEN';
  end if;

  if v_reservation.status <> 'reserved' then
    raise exception 'RESERVATION_NOT_ACTIVE';
  end if;

  update public.promotions
  set quantity_available = quantity_available + v_reservation.quantity
  where id = v_reservation.promotion_id;

  update public.reservations
  set status = 'cancelled'
  where id = p_reservation_id
  returning * into v_reservation;

  return to_jsonb(v_reservation);
end;
$$;

create or replace function public.set_reservation_status(
  p_reservation_id uuid,
  p_owner_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  if p_status not in ('picked_up', 'cancelled', 'expired') then
    raise exception 'INVALID_STATUS';
  end if;

  select r.* into v_reservation
  from public.reservations r
  join public.promotions p on p.id = r.promotion_id
  join public.shops s on s.id = p.shop_id
  where r.id = p_reservation_id
    and s.owner_id = p_owner_id
  for update of r;

  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if v_reservation.status <> 'reserved' then
    raise exception 'RESERVATION_NOT_ACTIVE';
  end if;

  if p_status in ('cancelled', 'expired') then
    update public.promotions
    set quantity_available = quantity_available + v_reservation.quantity
    where id = v_reservation.promotion_id;
  end if;

  update public.reservations
  set status = p_status
  where id = p_reservation_id
  returning * into v_reservation;

  return to_jsonb(v_reservation);
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The Express API uses the service role key and bypasses RLS.
-- Direct anon access is read-mostly for public listings.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.promotions enable row level security;
alter table public.reservations enable row level security;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists shops_public_read on public.shops;
create policy shops_public_read
on public.shops for select
to anon, authenticated
using (true);

drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read
on public.promotions for select
to anon, authenticated
using (true);

-- profiles and reservations stay API-only: no anon/authenticated policy is
-- created, so nothing but the service role can read them.
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists reservations_self_read on public.reservations;

-- ---------------------------------------------------------------------------
-- Seed categories
-- ---------------------------------------------------------------------------

insert into public.categories (name, slug)
values
  ('Bakery', 'bakery'),
  ('Pizza', 'pizza'),
  ('Asian', 'asian'),
  ('Drinks', 'drinks'),
  ('Groceries', 'groceries'),
  ('Desserts', 'desserts'),
  ('Vegetarian', 'vegetarian'),
  ('Other', 'other')
on conflict (slug) do nothing;
