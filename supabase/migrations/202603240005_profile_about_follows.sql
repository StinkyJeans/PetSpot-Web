-- Optional profile copy + details; follower graph for counts (defaults to 0 when empty)

alter table public.pet_profiles
  add column if not exists about_me text,
  add column if not exists location text,
  add column if not exists favorite_toy text,
  add column if not exists birthday date;

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists user_follows_followee_idx on public.user_follows (followee_id);
create index if not exists user_follows_follower_idx on public.user_follows (follower_id);

alter table public.user_follows enable row level security;

drop policy if exists "user_follows_select_involved" on public.user_follows;
create policy "user_follows_select_involved"
on public.user_follows
for select
to authenticated
using (follower_id = auth.uid() or followee_id = auth.uid());

drop policy if exists "user_follows_insert_own" on public.user_follows;
create policy "user_follows_insert_own"
on public.user_follows
for insert
to authenticated
with check (follower_id = auth.uid());

drop policy if exists "user_follows_delete_own" on public.user_follows;
create policy "user_follows_delete_own"
on public.user_follows
for delete
to authenticated
using (follower_id = auth.uid());
