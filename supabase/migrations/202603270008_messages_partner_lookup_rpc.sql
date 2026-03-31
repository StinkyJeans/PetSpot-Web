-- Resolve direct-message partner IDs via SECURITY DEFINER (avoids RLS blind spots)

create or replace function public.list_direct_conversation_partners()
returns table (conversation_id uuid, partner_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select
    me.conversation_id,
    other.user_id as partner_id
  from public.conversation_participants me
  join public.conversation_participants other
    on other.conversation_id = me.conversation_id
   and other.user_id <> me.user_id
  join public.conversations c
    on c.id = me.conversation_id
  where me.user_id = auth.uid()
    and c.kind = 'direct';
$$;

grant execute on function public.list_direct_conversation_partners() to authenticated;

