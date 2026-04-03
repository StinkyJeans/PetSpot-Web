-- Hint RPC is SECURITY DEFINER for privileges, but RLS still applies to the invoker
-- (anon on failed login). Without a SELECT policy, the RPC returns NULL and login
-- never shows the password-change hint.
-- Only `anon`: avoid USING (true) for `authenticated` (would expose all rows if SELECT is granted).
drop policy if exists "password_change_hints_select_anon_authenticated" on public.password_change_hints;
drop policy if exists "password_change_hints_select_anon" on public.password_change_hints;
create policy "password_change_hints_select_anon"
on public.password_change_hints
for select
to anon
using (true);
