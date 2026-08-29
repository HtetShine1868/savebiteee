-- Food Waste Solver — pickup codes.
-- Customers show a short code at the counter; owners search for it in the
-- reservations inbox. Safe to run more than once.

create extension if not exists pgcrypto;

alter table public.reservations
  add column if not exists pickup_code text;

create unique index if not exists reservations_pickup_code_key
  on public.reservations (pickup_code);

-- Same body as schema.sql, with the code generated inside the locked
-- transaction so it is unique and stock can still never go negative.
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

  loop
    v_code := 'FWS-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 5));
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

-- Existing reservations keep a stable code derived from their id.
update public.reservations
set pickup_code = 'FWS-' || upper(substr(replace(id::text, '-', ''), 1, 5))
where pickup_code is null;
