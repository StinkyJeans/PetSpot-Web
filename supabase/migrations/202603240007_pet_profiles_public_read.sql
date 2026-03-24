-- Allow any signed-in user to read profile fields needed for the feed (posts join pet_profiles).
-- Insert/update/delete remain owner-scoped via existing policies.

drop policy if exists "pet_profiles_select_own" on public.pet_profiles;

create policy "pet_profiles_select_authenticated"
on public.pet_profiles
for select
to authenticated
using (true);
