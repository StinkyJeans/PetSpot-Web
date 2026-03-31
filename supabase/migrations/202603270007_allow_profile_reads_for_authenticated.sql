-- Allow authenticated users to read public profile basics (needed for messaging/profile UI)

drop policy if exists "pet_profiles_select_own" on public.pet_profiles;
drop policy if exists "pet_profiles_select_authenticated" on public.pet_profiles;

create policy "pet_profiles_select_authenticated"
on public.pet_profiles
for select
to authenticated
using (true);

