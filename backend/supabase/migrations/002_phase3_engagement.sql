-- Food Waste Solver — Phase 3 engagement
-- Run after supabase/schema.sql. This migration is safe to run more than once.

create table if not exists public.shop_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);

create index if not exists shop_favorites_shop_id_idx
  on public.shop_favorites (shop_id);

alter table public.profiles
  add column if not exists email_notifications_enabled boolean not null default true,
  add column if not exists notify_favorite_shops boolean not null default true;

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  channel text not null check (channel in ('email')),
  status text not null check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, promotion_id, channel)
);

create index if not exists notification_log_user_id_idx
  on public.notification_log (user_id);
create index if not exists notification_log_promotion_id_idx
  on public.notification_log (promotion_id);

drop trigger if exists notification_log_updated_at on public.notification_log;
create trigger notification_log_updated_at
before update on public.notification_log
for each row execute function public.set_updated_at();

create index if not exists shops_coordinates_idx
  on public.shops (latitude, longitude)
  where latitude is not null and longitude is not null;

create or replace function public.haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
strict
as $$
  select 6371.0 * 2.0 * asin(
    sqrt(
      least(
        1.0,
        power(sin(radians(lat2 - lat1) / 2.0), 2)
        + cos(radians(lat1)) * cos(radians(lat2))
        * power(sin(radians(lon2 - lon1) / 2.0), 2)
      )
    )
  );
$$;

create or replace function public.search_promotions_nearby(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision default 10,
  p_query text default null,
  p_category text default null,
  p_city text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_ending_soon boolean default false,
  p_shop_ids uuid[] default null,
  p_category_ids uuid[] default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  shop_id uuid,
  category_id uuid,
  product_name text,
  description text,
  image_url text,
  original_price numeric,
  promo_price numeric,
  quantity_available integer,
  starts_at timestamptz,
  ends_at timestamptz,
  food_expires_at timestamptz,
  pickup_location text,
  created_at timestamptz,
  updated_at timestamptz,
  shop_owner_id uuid,
  shop_name text,
  shop_slug text,
  shop_city text,
  shop_address text,
  shop_latitude double precision,
  shop_longitude double precision,
  shop_image_url text,
  shop_phone text,
  category_name text,
  category_slug text,
  status text,
  distance_km double precision,
  full_count bigint
)
language sql
stable
set search_path = public
as $$
  with nearby as (
    select
      listing.*,
      public.haversine_km(
        p_latitude,
        p_longitude,
        listing.shop_latitude,
        listing.shop_longitude
      ) as calculated_distance
    from public.promotion_listings listing
    where listing.status = 'active'
      and listing.shop_latitude is not null
      and listing.shop_longitude is not null
      and (p_category is null or listing.category_slug = p_category)
      and (p_city is null or listing.shop_city ilike '%' || p_city || '%')
      and (p_min_price is null or listing.promo_price >= p_min_price)
      and (p_max_price is null or listing.promo_price <= p_max_price)
      and (
        not p_ending_soon
        or listing.ends_at <= now() + interval '2 hours'
      )
      and (
        p_shop_ids is null
        or listing.shop_id = any(p_shop_ids)
      )
      and (
        p_category_ids is null
        or listing.category_id = any(p_category_ids)
      )
      and (
        p_query is null
        or listing.product_name ilike '%' || p_query || '%'
        or listing.shop_name ilike '%' || p_query || '%'
        or listing.category_name ilike '%' || p_query || '%'
      )
  ),
  filtered as (
    select *
    from nearby
    where calculated_distance <= p_radius_km
  )
  select
    filtered.id,
    filtered.shop_id,
    filtered.category_id,
    filtered.product_name,
    filtered.description,
    filtered.image_url,
    filtered.original_price,
    filtered.promo_price,
    filtered.quantity_available,
    filtered.starts_at,
    filtered.ends_at,
    filtered.food_expires_at,
    filtered.pickup_location,
    filtered.created_at,
    filtered.updated_at,
    filtered.shop_owner_id,
    filtered.shop_name,
    filtered.shop_slug,
    filtered.shop_city,
    filtered.shop_address,
    filtered.shop_latitude,
    filtered.shop_longitude,
    filtered.shop_image_url,
    filtered.shop_phone,
    filtered.category_name,
    filtered.category_slug,
    filtered.status,
    filtered.calculated_distance as distance_km,
    count(*) over () as full_count
  from filtered
  order by filtered.calculated_distance asc, filtered.ends_at asc
  limit greatest(1, least(coalesce(p_limit, 20), 50))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

alter table public.shop_favorites enable row level security;
alter table public.notification_log enable row level security;

drop policy if exists shop_favorites_self_read on public.shop_favorites;
create policy shop_favorites_self_read
on public.shop_favorites for select
to authenticated
using (user_id = auth.uid());

drop policy if exists shop_favorites_self_insert on public.shop_favorites;
create policy shop_favorites_self_insert
on public.shop_favorites for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists shop_favorites_self_delete on public.shop_favorites;
create policy shop_favorites_self_delete
on public.shop_favorites for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists notification_log_self_read on public.notification_log;
create policy notification_log_self_read
on public.notification_log for select
to authenticated
using (user_id = auth.uid());
