-- Fix RLS recursion/internal 500s for messaging endpoints

drop policy if exists "participants_select_own" on public.conversation_participants;

create policy "participants_select_own"
on public.conversation_participants
for select
to authenticated
using (user_id = auth.uid());

