-- Запрет смены цены/депозита при активных бронях (защита на уровне БД).
-- Выполните в Supabase SQL Editor.

create or replace function public.prevent_item_price_change_during_rental()
returns trigger language plpgsql as $$
begin
  if (
    OLD.price_per_day is distinct from NEW.price_per_day
    or OLD.deposit is distinct from NEW.deposit
  ) and exists (
    select 1 from public.bookings b
    where b.item_id = NEW.id
      and b.status in ('pending', 'confirmed', 'active')
  ) then
    raise exception 'Price and deposit cannot be changed while rental is active';
  end if;
  return NEW;
end;
$$;

drop trigger if exists items_price_lock_on_active_booking on public.items;
create trigger items_price_lock_on_active_booking
  before update on public.items
  for each row execute function public.prevent_item_price_change_during_rental();
