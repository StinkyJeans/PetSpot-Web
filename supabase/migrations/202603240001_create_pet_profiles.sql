create extension if not exists "pgcrypto";

create table if not exists public.pet_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_name text not null,
  breed text not null,
  age_years integer not null check (age_years >= 0),
  avatar_url text,
  is_primary boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists pet_profiles_owner_primary_idx
  on public.pet_profiles (owner_id, is_primary)
  where is_primary = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists pet_profiles_set_updated_at on public.pet_profiles;
create trigger pet_profiles_set_updated_at
before update on public.pet_profiles
for each row
execute function public.set_updated_at();

alter table public.pet_profiles enable row level security;

drop policy if exists "pet_profiles_select_own" on public.pet_profiles;
create policy "pet_profiles_select_own"
on public.pet_profiles
for select
using (auth.uid() = owner_id);

drop policy if exists "pet_profiles_insert_own" on public.pet_profiles;
create policy "pet_profiles_insert_own"
on public.pet_profiles
for insert
with check (auth.uid() = owner_id);

drop policy if exists "pet_profiles_update_own" on public.pet_profiles;
create policy "pet_profiles_update_own"
on public.pet_profiles
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "pet_profiles_delete_own" on public.pet_profiles;
create policy "pet_profiles_delete_own"
on public.pet_profiles
for delete
using (auth.uid() = owner_id);
