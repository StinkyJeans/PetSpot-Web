-- Stories (single per user, expires after 24h) + per-view tracking + realtime publication
create extension if not exists "pgcrypto";

-- One active story per user is enforced by application logic (we delete active rows before insert).
create table if not exists public.user_stories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  media_kind text not null check (media_kind in ('image', 'video')),
  media_url text not null,
  caption text,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_stories_owner_expires_idx on public.user_stories (owner_id, expires_at desc);
create index if not exists user_stories_expires_at_idx on public.user_stories (expires_at desc);

-- Unique view tracking (one view per viewer per story).
create table if not exists public.story_views (
  story_id uuid not null references public.user_stories (id) on delete cascade,
  viewer_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (story_id, viewer_user_id)
);

create index if not exists story_views_viewer_user_id_idx on public.story_views (viewer_user_id);

alter table public.user_stories enable row level security;
alter table public.story_views enable row level security;

-- user_stories policies
drop policy if exists "user_stories_select_authenticated" on public.user_stories;
create policy "user_stories_select_authenticated"
on public.user_stories
for select
to authenticated
using (true);

drop policy if exists "user_stories_insert_own" on public.user_stories;
create policy "user_stories_insert_own"
on public.user_stories
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "user_stories_delete_own" on public.user_stories;
create policy "user_stories_delete_own"
on public.user_stories
for delete
to authenticated
using (auth.uid() = owner_id);

-- story_views policies (viewer can read only their own views)
drop policy if exists "story_views_select_own" on public.story_views;
create policy "story_views_select_own"
on public.story_views
for select
to authenticated
using (auth.uid() = viewer_user_id);

drop policy if exists "story_views_insert_own" on public.story_views;
create policy "story_views_insert_own"
on public.story_views
for insert
to authenticated
with check (auth.uid() = viewer_user_id);

drop policy if exists "story_views_delete_own" on public.story_views;
create policy "story_views_delete_own"
on public.story_views
for delete
to authenticated
using (auth.uid() = viewer_user_id);

-- Storage bucket for story media (public read, owner-only write).
insert into storage.buckets (id, name, public)
values ('media-stories', 'media-stories', true)
on conflict (id) do nothing;

-- Public viewers can read story media.
drop policy if exists "media_stories_public_read" on storage.objects;
create policy "media_stories_public_read"
on storage.objects
for select
to public
using (bucket_id = 'media-stories');

-- Owner can insert/update/delete objects within their folder.
drop policy if exists "media_stories_auth_insert_own" on storage.objects;
create policy "media_stories_auth_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media-stories'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "media_stories_auth_update_own" on storage.objects;
create policy "media_stories_auth_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media-stories'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'media-stories'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "media_stories_auth_delete_own" on storage.objects;
create policy "media_stories_auth_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media-stories'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable realtime for story inserts/deletes (avoid duplicate publication membership errors).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_stories'
  ) then
    alter publication supabase_realtime add table public.user_stories;
  end if;
end $$;

