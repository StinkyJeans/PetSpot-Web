-- Event interest (Event's Followed)
create table if not exists public.event_interests (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, event_id)
);

create index if not exists event_interests_event_idx on public.event_interests (event_id);

alter table public.event_interests enable row level security;

drop policy if exists "event_interests_select_own" on public.event_interests;
create policy "event_interests_select_own"
on public.event_interests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "event_interests_insert_own" on public.event_interests;
create policy "event_interests_insert_own"
on public.event_interests
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "event_interests_delete_own" on public.event_interests;
create policy "event_interests_delete_own"
on public.event_interests
for delete
to authenticated
using (user_id = auth.uid());

