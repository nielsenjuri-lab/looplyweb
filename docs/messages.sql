-- Чат по бронированию. Выполните в Supabase SQL Editor.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(trim(text)) > 0 and char_length(text) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_booking_created_idx
  on public.messages (booking_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants" on public.messages
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.renter_id = auth.uid() or b.owner_id = auth.uid())
        and b.status in ('confirmed', 'active', 'completed')
    )
  );

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.renter_id = auth.uid() or b.owner_id = auth.uid())
        and b.status in ('confirmed', 'active')
    )
  );

-- Realtime (опционально): Database → Replication → включить messages
