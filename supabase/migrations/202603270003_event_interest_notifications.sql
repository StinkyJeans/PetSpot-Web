-- Adds notifications when someone marks interest in one of your events

-- Extend notifications type check to include event interests.
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('post_like', 'post_comment', 'comment_reply', 'comment_like', 'follow', 'event_interested'));

-- Extra event metadata for the dropdown message.
alter table public.notifications
  add column if not exists event_id uuid;

alter table public.notifications
  add column if not exists event_title text;

alter table public.notifications
  add column if not exists event_when text;

alter table public.notifications
  add column if not exists event_place text;

-- Security definer helper to insert notifications.
create or replace function public.notify_event_interested(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_owner uuid;
  v_event_type text;
  v_event_date date;
  v_event_time time;
  v_city text;
  v_country text;
begin
  if auth.uid() is null then
    return;
  end if;

  if p_event_id is null then
    return;
  end if;

  select owner_id, event_type, event_date, event_time, city, country
    into v_owner, v_event_type, v_event_date, v_event_time, v_city, v_country
  from public.events
  where id = p_event_id;

  -- Event not found or viewer is the owner => do nothing.
  if v_owner is null or v_owner = auth.uid() then
    return;
  end if;

  insert into public.notifications (user_id, type, actor_id, event_id, event_title, event_when, event_place)
  values (
    v_owner,
    'event_interested',
    auth.uid(),
    p_event_id,
    case
      when v_event_type = 'dog-show' then 'Dog show'
      when v_event_type = 'pet-adoption' then 'Pet adoption'
      else 'Meet up'
    end,
    v_event_date::text || ' • ' || to_char(v_event_time, 'HH24:MI'),
    v_city || ', ' || v_country
  );
end;
$$;

grant execute on function public.notify_event_interested(uuid) to authenticated;

