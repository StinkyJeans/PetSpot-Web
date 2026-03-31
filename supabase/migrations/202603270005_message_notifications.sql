-- Message notifications for realtime inbox alerts

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'post_like',
      'post_comment',
      'comment_reply',
      'comment_like',
      'follow',
      'event_interested',
      'message'
    )
  );

alter table public.notifications
  add column if not exists conversation_id uuid references public.conversations (id) on delete cascade;

alter table public.notifications
  add column if not exists message_id uuid references public.messages (id) on delete cascade;

create or replace function public.notify_message_sent(p_conversation_id uuid, p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    return;
  end if;

  if p_conversation_id is null or p_message_id is null then
    return;
  end if;

  insert into public.notifications (user_id, type, actor_id, conversation_id, message_id)
  select cp.user_id, 'message', v_actor, p_conversation_id, p_message_id
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.user_id <> v_actor;
end;
$$;

grant execute on function public.notify_message_sent(uuid, uuid) to authenticated;

