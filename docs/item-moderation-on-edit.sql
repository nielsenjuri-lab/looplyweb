-- Любое изменение объявления владельцем → снова модерация.
-- Владелец не может сам опубликовать (только админ).
-- Supabase SQL Editor.

create or replace function public.enforce_item_moderation_on_edit()
returns trigger language plpgsql as $$
begin
  -- Только действия владельца (не админа)
  if auth.uid() is not null and auth.uid() = OLD.owner_id then
    -- Запрет самопубликации
    if NEW.status = 'published' and OLD.status is distinct from 'published' then
      raise exception 'Публикация только через модерацию администратора';
    end if;

    -- Любое изменение контента опубликованного объявления
    if OLD.status = 'published' and (
      OLD.title is distinct from NEW.title
      or OLD.description is distinct from NEW.description
      or OLD.category_id is distinct from NEW.category_id
      or OLD.district is distinct from NEW.district
      or OLD.price_per_day is distinct from NEW.price_per_day
      or OLD.deposit is distinct from NEW.deposit
      or OLD.rules is distinct from NEW.rules
      or OLD.pickup_hours is distinct from NEW.pickup_hours
      or OLD.pickup_note is distinct from NEW.pickup_note
      or OLD.image_urls is distinct from NEW.image_urls
    ) then
      NEW.status := 'moderation';
      NEW.reject_reason := null;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists items_moderation_on_owner_edit on public.items;
create trigger items_moderation_on_owner_edit
  before update on public.items
  for each row execute function public.enforce_item_moderation_on_edit();
