create table if not exists public.pet_profile_media_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_profile_id uuid not null references public.pet_profiles (id) on delete cascade,
  media_kind text not null check (media_kind in ('profile', 'background')),
  bucket_id text not null,
  object_path text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists pet_profile_media_history_current_idx
  on public.pet_profile_media_history (pet_profile_id, media_kind)
  where is_current = true;

alter table public.pet_profile_media_history enable row level security;

drop policy if exists "pet_profile_media_history_select_own" on public.pet_profile_media_history;
create policy "pet_profile_media_history_select_own"
on public.pet_profile_media_history
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "pet_profile_media_history_insert_own" on public.pet_profile_media_history;
create policy "pet_profile_media_history_insert_own"
on public.pet_profile_media_history
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "pet_profile_media_history_update_own" on public.pet_profile_media_history;
create policy "pet_profile_media_history_update_own"
on public.pet_profile_media_history
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

alter table public.pet_profiles
  add column if not exists profile_image_url text,
  add column if not exists background_image_url text;

alter table public.posts
  add column if not exists media_url text,
  add column if not exists media_kind text check (media_kind in ('image', 'video'));

insert into storage.buckets (id, name, public)
values ('profile-picture', 'profile-picture', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('background-picture', 'background-picture', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media-post', 'media-post', true)
on conflict (id) do nothing;

drop policy if exists "profile_picture_public_read" on storage.objects;
create policy "profile_picture_public_read"
on storage.objects
for select
to public
using (bucket_id = 'profile-picture');

drop policy if exists "profile_picture_auth_insert_own" on storage.objects;
create policy "profile_picture_auth_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_picture_auth_update_own" on storage.objects;
create policy "profile_picture_auth_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "profile_picture_auth_delete_own" on storage.objects;
create policy "profile_picture_auth_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "background_picture_public_read" on storage.objects;
create policy "background_picture_public_read"
on storage.objects
for select
to public
using (bucket_id = 'background-picture');

drop policy if exists "background_picture_auth_insert_own" on storage.objects;
create policy "background_picture_auth_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'background-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "background_picture_auth_update_own" on storage.objects;
create policy "background_picture_auth_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'background-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'background-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "background_picture_auth_delete_own" on storage.objects;
create policy "background_picture_auth_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'background-picture'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "media_post_public_read" on storage.objects;
create policy "media_post_public_read"
on storage.objects
for select
to public
using (bucket_id = 'media-post');

drop policy if exists "media_post_auth_insert_own" on storage.objects;
create policy "media_post_auth_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media-post'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "media_post_auth_update_own" on storage.objects;
create policy "media_post_auth_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media-post'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'media-post'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "media_post_auth_delete_own" on storage.objects;
create policy "media_post_auth_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media-post'
  and (storage.foldername(name))[1] = auth.uid()::text
);
