-- Передача вещи, оплата, прочтение сообщений. Supabase SQL Editor.

-- Поля бронирования
alter table public.bookings add column if not exists renter_pickup_confirmed_at timestamptz;
alter table public.bookings add column if not exists owner_handover_confirmed_at timestamptz;
alter table public.bookings add column if not exists pickup_rejected_at timestamptz;
alter table public.bookings add column if not exists pickup_reject_reason text
  check (pickup_reject_reason is null or char_length(trim(pickup_reject_reason)) <= 500);
alter table public.bookings add column if not exists payment_captured_at timestamptz;
alter table public.bookings add column if not exists payment_status text not null default 'pending';

-- Прочтение сообщений
create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  reader_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, reader_id)
);

create index if not exists message_reads_message_idx on public.message_reads (message_id);

alter table public.message_reads enable row level security;

drop policy if exists "message_reads_select_participants" on public.message_reads;
create policy "message_reads_select_participants" on public.message_reads
  for select using (
    exists (
      select 1 from public.messages m
      join public.bookings b on b.id = m.booking_id
      where m.id = message_id
        and (b.renter_id = auth.uid() or b.owner_id = auth.uid())
    )
  );

drop policy if exists "message_reads_upsert_self" on public.message_reads;
create policy "message_reads_insert_self" on public.message_reads
  for insert with check (reader_id = auth.uid());

drop policy if exists "message_reads_update_self" on public.message_reads;
create policy "message_reads_update_self" on public.message_reads
  for update using (reader_id = auth.uid());

-- Обновление бронирования при передаче (свайп / отказ)
drop policy if exists "bookings_renter_pickup" on public.bookings;
create policy "bookings_renter_pickup" on public.bookings
  for update using (
    auth.uid() = renter_id
    and status = 'confirmed'
    and renter_pickup_confirmed_at is null
    and pickup_rejected_at is null
  )
  with check (
    auth.uid() = renter_id
    and (
      (renter_pickup_confirmed_at is not null and status = 'confirmed')
      or (pickup_rejected_at is not null and status = 'cancelled' and pickup_reject_reason is not null)
    )
  );

drop policy if exists "bookings_owner_handover" on public.bookings;
create policy "bookings_owner_handover" on public.bookings
  for update using (
    auth.uid() = owner_id
    and status = 'confirmed'
    and owner_handover_confirmed_at is null
    and renter_pickup_confirmed_at is not null
    and pickup_rejected_at is null
  )
  with check (auth.uid() = owner_id);

drop policy if exists "bookings_activate_after_handover" on public.bookings;
create policy "bookings_activate_after_handover" on public.bookings
  for update using (
    (auth.uid() = renter_id or auth.uid() = owner_id)
    and status = 'confirmed'
    and renter_pickup_confirmed_at is not null
    and owner_handover_confirmed_at is not null
    and pickup_rejected_at is null
  )
  with check (
    status = 'active'
    and payment_status = 'captured'
    and payment_captured_at is not null
  );
