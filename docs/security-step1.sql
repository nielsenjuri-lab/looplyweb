-- ШАГ 1 безопасности Looply
-- Supabase → SQL Editor → вставить целиком → Run
--
-- Что делает:
-- 1) Цену и депозит считает база, не браузер
-- 2) Нельзя подделать статус брони напрямую
-- 3) Свайп передачи — одной проверенной функцией
-- 4) Телефон владельца — только через функцию при подтверждённой брони
--
-- Перед запуском: выполните docs/booking-handover.sql (колонки передачи)
-- и docs/messages.sql (чат), если ещё не делали.

-- ─── Колонки handover (на случай если booking-handover.sql не запускали) ───
alter table public.bookings add column if not exists renter_pickup_confirmed_at timestamptz;
alter table public.bookings add column if not exists owner_handover_confirmed_at timestamptz;
alter table public.bookings add column if not exists pickup_rejected_at timestamptz;
alter table public.bookings add column if not exists pickup_reject_reason text
  check (pickup_reject_reason is null or char_length(trim(pickup_reject_reason)) <= 500);
alter table public.bookings add column if not exists payment_captured_at timestamptz;
alter table public.bookings add column if not exists payment_status text not null default 'pending';

-- ─── Убираем слишком широкие правила ───
drop policy if exists "Участники обновляют бронь" on public.bookings;
drop policy if exists "Арендатор создаёт бронь" on public.bookings;
drop policy if exists "bookings_renter_pickup" on public.bookings;
drop policy if exists "bookings_owner_handover" on public.bookings;
drop policy if exists "bookings_activate_after_handover" on public.bookings;

-- После этого: insert/update в bookings только через функции ниже (они обходят RLS безопасно)

-- ─── Вспомогательные функции ───
create or replace function public.dates_overlap(a_start date, a_end date, b_start date, b_end date)
returns boolean language sql immutable as $$
  select a_start <= b_end and a_end >= b_start;
$$;

create or replace function public.booking_day_count(p_start date, p_end date)
returns int language sql immutable as $$
  select (p_end - p_start + 1)::int;
$$;

create or replace function public.item_dates_available(p_item_id uuid, p_start date, p_end date)
returns boolean language plpgsql stable as $$
declare
  v_has_slots boolean;
  v_missing int;
begin
  select exists(select 1 from public.item_available_dates where item_id = p_item_id limit 1)
    into v_has_slots;
  if not v_has_slots then return true; end if;

  select count(*) into v_missing
  from generate_series(p_start, p_end, interval '1 day') gs(d)
  where not exists (
    select 1 from public.item_available_dates ad
    where ad.item_id = p_item_id and ad.date = gs.d::date
  );
  return v_missing = 0;
end;
$$;

create or replace function public.booking_has_conflict(
  p_item_id uuid, p_start date, p_end date, p_exclude uuid default null
) returns boolean language sql stable as $$
  select exists (
    select 1 from public.bookings b
    where b.item_id = p_item_id
      and b.status in ('pending', 'confirmed', 'active')
      and (p_exclude is null or b.id <> p_exclude)
      and public.dates_overlap(b.start_date, b.end_date, p_start, p_end)
  );
$$;

-- ─── 1. Создание заявки на аренду ───
create or replace function public.create_booking_request(
  p_item_id uuid,
  p_start_date date,
  p_end_date date
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item public.items%rowtype;
  v_days int;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Войдите в аккаунт';
  end if;

  select * into v_item from public.items where id = p_item_id;
  if not found or v_item.status <> 'published' then
    raise exception 'Объявление недоступно';
  end if;
  if v_item.owner_id = v_user then
    raise exception 'Нельзя арендовать своё объявление';
  end if;
  if p_end_date < p_start_date then
    raise exception 'Неверные даты';
  end if;

  v_days := public.booking_day_count(p_start_date, p_end_date);
  if v_days < 1 or v_days > 7 then
    raise exception 'Можно забронировать от 1 до 7 дней';
  end if;
  if p_start_date < current_date then
    raise exception 'Нельзя выбрать прошедшие даты';
  end if;
  if not public.item_dates_available(p_item_id, p_start_date, p_end_date) then
    raise exception 'В выбранные дни вещь недоступна';
  end if;
  if public.booking_has_conflict(p_item_id, p_start_date, p_end_date) then
    raise exception 'Эти даты уже заняты';
  end if;

  insert into public.bookings (
    item_id, owner_id, renter_id,
    start_date, end_date,
    total_amount, deposit_amount,
    status
  ) values (
    p_item_id, v_item.owner_id, v_user,
    p_start_date, p_end_date,
    v_item.price_per_day * v_days,
    v_item.deposit,
    'pending'
  ) returning id into v_id;

  return v_id;
end;
$$;

-- ─── 2. Смена статуса (принять / отклонить / отменить / завершить) ───
create or replace function public.booking_status_action(
  p_booking_id uuid,
  p_action text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_b public.bookings%rowtype;
begin
  if v_user is null then raise exception 'Войдите в аккаунт'; end if;

  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Бронь не найдена'; end if;

  if p_action = 'owner_confirm' then
    if v_user <> v_b.owner_id then raise exception 'Только владелец может принять'; end if;
    if v_b.status <> 'pending' then raise exception 'Заявка уже обработана'; end if;
    if public.booking_has_conflict(v_b.item_id, v_b.start_date, v_b.end_date, v_b.id) then
      raise exception 'Эти даты уже заняты другой бронью';
    end if;
    update public.bookings set status = 'confirmed', updated_at = now() where id = p_booking_id;

  elsif p_action = 'owner_reject' then
    if v_user <> v_b.owner_id then raise exception 'Только владелец может отклонить'; end if;
    if v_b.status <> 'pending' then raise exception 'Заявка уже обработана'; end if;
    update public.bookings set status = 'cancelled', updated_at = now() where id = p_booking_id;

  elsif p_action = 'renter_cancel' then
    if v_user <> v_b.renter_id then raise exception 'Только арендатор может отменить'; end if;
    if v_b.status <> 'pending' then raise exception 'Можно отменить только ожидающую заявку'; end if;
    update public.bookings set status = 'cancelled', updated_at = now() where id = p_booking_id;

  elsif p_action = 'owner_complete' then
    if v_user <> v_b.owner_id then raise exception 'Только владелец может завершить'; end if;
    if v_b.status <> 'active' then raise exception 'Аренда ещё не активна'; end if;
    update public.bookings set status = 'completed', updated_at = now() where id = p_booking_id;

  else
    raise exception 'Неизвестное действие';
  end if;
end;
$$;

-- ─── 3. Свайп передачи ───
create or replace function public.handover_confirm_pickup(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_b public.bookings%rowtype;
  v_now timestamptz := now();
begin
  if v_user is null then raise exception 'Войдите в аккаунт'; end if;

  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Бронь не найдена'; end if;
  if v_b.status <> 'confirmed' then raise exception 'Передача доступна только для подтверждённой брони'; end if;
  if v_b.pickup_rejected_at is not null then raise exception 'Аренда уже отменена'; end if;

  if v_user = v_b.renter_id then
    if v_b.renter_pickup_confirmed_at is not null then raise exception 'Вы уже подтвердили'; end if;
    update public.bookings set renter_pickup_confirmed_at = v_now, updated_at = v_now where id = p_booking_id;
  elsif v_user = v_b.owner_id then
    if v_b.renter_pickup_confirmed_at is null then
      raise exception 'Сначала арендатор должен подтвердить получение';
    end if;
    if v_b.owner_handover_confirmed_at is not null then raise exception 'Вы уже подтвердили'; end if;
    update public.bookings set owner_handover_confirmed_at = v_now, updated_at = v_now where id = p_booking_id;
  else
    raise exception 'Нет доступа';
  end if;

  select * into v_b from public.bookings where id = p_booking_id;
  if v_b.renter_pickup_confirmed_at is not null and v_b.owner_handover_confirmed_at is not null then
    update public.bookings set
      status = 'active',
      payment_status = 'captured',
      payment_captured_at = v_now,
      updated_at = v_now
    where id = p_booking_id;
  end if;
end;
$$;

-- ─── 4. Отказ при осмотре ───
create or replace function public.handover_reject_pickup(p_booking_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_b public.bookings%rowtype;
  v_reason text := trim(p_reason);
  v_now timestamptz := now();
begin
  if v_user is null then raise exception 'Войдите в аккаунт'; end if;
  if v_reason = '' then raise exception 'Укажите причину'; end if;
  if char_length(v_reason) > 500 then raise exception 'Максимум 500 символов'; end if;

  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Бронь не найдена'; end if;
  if v_user <> v_b.renter_id then raise exception 'Только арендатор может отказаться'; end if;
  if v_b.status <> 'confirmed' then raise exception 'Отказ доступен только при подтверждённой брони'; end if;
  if v_b.renter_pickup_confirmed_at is not null then raise exception 'Вы уже подтвердили получение'; end if;

  update public.bookings set
    status = 'cancelled',
    pickup_rejected_at = v_now,
    pickup_reject_reason = v_reason,
    updated_at = v_now
  where id = p_booking_id;
end;
$$;

-- ─── 5. Телефон владельца — только участникам подтверждённой/активной брони ───
create or replace function public.get_owner_phone_for_booking(p_booking_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_b public.bookings%rowtype;
  v_phone text;
begin
  if v_user is null then return null; end if;

  select * into v_b from public.bookings where id = p_booking_id;
  if not found then return null; end if;

  if v_user = v_b.owner_id then
    select phone into v_phone from public.profiles where id = v_b.owner_id;
    return v_phone;
  end if;

  if v_user = v_b.renter_id and v_b.status in ('confirmed', 'active') then
    select phone into v_phone from public.profiles where id = v_b.owner_id;
    return v_phone;
  end if;

  return null;
end;
$$;

grant execute on function public.create_booking_request(uuid, date, date) to authenticated;
grant execute on function public.booking_status_action(uuid, text) to authenticated;
grant execute on function public.handover_confirm_pickup(uuid) to authenticated;
grant execute on function public.handover_reject_pickup(uuid, text) to authenticated;
grant execute on function public.get_owner_phone_for_booking(uuid) to authenticated;
