create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  event_date date not null,
  event_time time not null,
  city text not null,
  country text not null,
  event_type text not null check (event_type in ('meet-up', 'dog-show', 'pet-adoption')),
  purpose text not null check (char_length(trim(purpose)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists events_owner_date_idx
  on public.events (owner_id, event_date, event_time);

alter table public.events enable row level security;

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own"
on public.events
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own"
on public.events
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own"
on public.events
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own"
on public.events
for delete
to authenticated
using (auth.uid() = owner_id);
