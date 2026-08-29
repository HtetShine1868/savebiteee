-- Food Waste Solver — move authentication out of Supabase Auth.
-- Supabase is now the database only: the Express API stores credentials in
-- public.profiles and issues its own JWTs.
-- Safe to run more than once.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists email text,
  add column if not exists password_hash text,
  add column if not exists auth_provider text not null default 'password',
  add column if not exists avatar_url text;

-- profiles.id used to mirror auth.users.id; the API now generates it.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

create unique index if not exists profiles_email_key
  on public.profiles (lower(email));

-- These policies matched on auth.uid(), which is always null now that sessions
-- are issued by the API. Dropping them keeps the tables service-role only.
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists reservations_self_read on public.reservations;
drop policy if exists shop_favorites_self_read on public.shop_favorites;
drop policy if exists shop_favorites_self_insert on public.shop_favorites;
drop policy if exists shop_favorites_self_delete on public.shop_favorites;
drop policy if exists notification_log_self_read on public.notification_log;
