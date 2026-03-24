-- Allow authenticated users to see all events for the shared event section.
-- Write operations remain owner-scoped.

drop policy if exists "events_select_own" on public.events;

create policy "events_select_authenticated"
on public.events
for select
to authenticated
using (true);
