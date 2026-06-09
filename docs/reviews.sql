-- Отзывы после завершённой аренды
-- Выполнить в Supabase SQL Editor, если таблица reviews уже есть

-- Один отзыв на одну аренду от одного человека
create unique index if not exists reviews_booking_reviewer_unique
  on public.reviews (booking_id, reviewer_id);

-- Пересчёт рейтинга в профиле
create or replace function public.update_profile_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set
    rating = coalesce((
      select round(avg(rating)::numeric, 2)
      from public.reviews where reviewee_id = NEW.reviewee_id
    ), 0),
    review_count = (
      select count(*)::int from public.reviews where reviewee_id = NEW.reviewee_id
    )
  where id = NEW.reviewee_id;
  return NEW;
end;
$$;

drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.update_profile_rating();

-- Можно вызвать вручную из приложения после отзыва
create or replace function public.recalculate_profile_rating(target_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set
    rating = coalesce((
      select round(avg(rating)::numeric, 2)
      from public.reviews where reviewee_id = target_id
    ), 0),
    review_count = (
      select count(*)::int from public.reviews where reviewee_id = target_id
    )
  where id = target_id;
end;
$$;

grant execute on function public.recalculate_profile_rating(uuid) to authenticated;

-- Только после завершённой аренды, только участникам
drop policy if exists "Автор создаёт отзыв" on public.reviews;
create policy "Автор создаёт отзыв" on public.reviews
  for insert with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.status = 'completed'
        and (b.renter_id = auth.uid() or b.owner_id = auth.uid())
        and (
          (b.renter_id = auth.uid() and b.owner_id = reviewee_id)
          or (b.owner_id = auth.uid() and b.renter_id = reviewee_id)
        )
    )
  );
