-- Realtime direct messaging

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants (user_id, joined_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member"
on public.conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "participants_select_own" on public.conversation_participants;
create policy "participants_select_own"
on public.conversation_participants
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "participants_insert_own" on public.conversation_participants;
create policy "participants_insert_own"
on public.conversation_participants
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "participants_update_own" on public.conversation_participants;
create policy "participants_update_own"
on public.conversation_participants
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "messages_insert_member_sender" on public.messages;
create policy "messages_insert_member_sender"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
);

-- Create or reuse a 1:1 conversation between auth.uid() and target user.
create or replace function public.get_or_create_direct_conversation(p_target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid;
  v_conversation_id uuid;
begin
  v_me := auth.uid();
  if v_me is null then
    return null;
  end if;
  if p_target_user is null or p_target_user = v_me then
    return null;
  end if;

  select c.id
    into v_conversation_id
  from public.conversations c
  join public.conversation_participants cp
    on cp.conversation_id = c.id
  where c.kind = 'direct'
    and cp.user_id in (v_me, p_target_user)
  group by c.id
  having count(*) = 2
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (kind)
  values ('direct')
  returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (v_conversation_id, v_me), (v_conversation_id, p_target_user)
  on conflict do nothing;

  return v_conversation_id;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then
    null;
  when others then
    null;
end $$;

