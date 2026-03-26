-- Ensure follower graph exists when this migration is executed standalone.
create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists user_follows_followee_idx on public.user_follows (followee_id);
create index if not exists user_follows_follower_idx on public.user_follows (follower_id);

alter table public.user_follows enable row level security;

drop policy if exists "user_follows_select_involved" on public.user_follows;
create policy "user_follows_select_involved"
on public.user_follows
for select
to authenticated
using (follower_id = auth.uid() or followee_id = auth.uid());

drop policy if exists "user_follows_insert_own" on public.user_follows;
create policy "user_follows_insert_own"
on public.user_follows
for insert
to authenticated
with check (follower_id = auth.uid());

drop policy if exists "user_follows_delete_own" on public.user_follows;
create policy "user_follows_delete_own"
on public.user_follows
for delete
to authenticated
using (follower_id = auth.uid());

-- Public follower/following counts (RLS on user_follows only exposes rows you're in).
create or replace function public.follow_counts_for_user(target_user uuid)
returns table (followers bigint, following bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::bigint from public.user_follows where followee_id = target_user),
    (select count(*)::bigint from public.user_follows where follower_id = target_user);
$$;

grant execute on function public.follow_counts_for_user(uuid) to authenticated;

-- Notifications (insert only via SECURITY DEFINER helpers below).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('post_like', 'post_comment', 'comment_reply', 'comment_like', 'follow')),
  actor_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.post_comments (id) on delete cascade,
  parent_comment_id uuid references public.post_comments (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

-- If notifications already existed from an older migration, widen the type check.
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('post_like', 'post_comment', 'comment_reply', 'comment_like', 'follow'));

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Realtime for dropdown subscriptions
do $$
begin
  -- Postgres doesn't support IF NOT EXISTS for ALTER PUBLICATION.
  -- So we safely attempt the add and ignore the "already exists" case.
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then
    null;
  when others then
    -- If supabase_realtime doesn't exist or any other publication error occurs,
    -- we still want the migration to apply for follow/notification functions.
    null;
end $$;

-- notify_post_liked: recipient = post owner
create or replace function public.notify_post_liked(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if auth.uid() is null then
    return;
  end if;
  select owner_id into v_owner from public.posts where id = p_post_id;
  if v_owner is null or v_owner = auth.uid() then
    return;
  end if;
  insert into public.notifications (user_id, type, actor_id, post_id)
  values (v_owner, 'post_like', auth.uid(), p_post_id);
end;
$$;

grant execute on function public.notify_post_liked(uuid) to authenticated;

-- New comment on post (top-level only — replies use notify_comment_replied)
create or replace function public.notify_post_commented(p_post_id uuid, p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if auth.uid() is null then
    return;
  end if;
  select owner_id into v_owner from public.posts where id = p_post_id;
  if v_owner is null or v_owner = auth.uid() then
    return;
  end if;
  insert into public.notifications (user_id, type, actor_id, post_id, comment_id)
  values (v_owner, 'post_comment', auth.uid(), p_post_id, p_comment_id);
end;
$$;

grant execute on function public.notify_post_commented(uuid, uuid) to authenticated;

-- Reply to a comment
create or replace function public.notify_comment_replied(p_parent_comment_id uuid, p_reply_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_author uuid;
  v_post_id uuid;
begin
  if auth.uid() is null then
    return;
  end if;
  select user_id, post_id into v_parent_author, v_post_id
  from public.post_comments
  where id = p_parent_comment_id;
  if v_parent_author is null or v_parent_author = auth.uid() then
    return;
  end if;
  insert into public.notifications (user_id, type, actor_id, post_id, comment_id, parent_comment_id)
  values (v_parent_author, 'comment_reply', auth.uid(), v_post_id, p_reply_comment_id, p_parent_comment_id);
end;
$$;

grant execute on function public.notify_comment_replied(uuid, uuid) to authenticated;

-- Like on a comment
create or replace function public.notify_comment_liked(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  v_post_id uuid;
begin
  if auth.uid() is null then
    return;
  end if;
  select user_id, post_id into v_author, v_post_id
  from public.post_comments
  where id = p_comment_id;
  if v_author is null or v_author = auth.uid() then
    return;
  end if;
  insert into public.notifications (user_id, type, actor_id, post_id, comment_id)
  values (v_author, 'comment_like', auth.uid(), v_post_id, p_comment_id);
end;
$$;

grant execute on function public.notify_comment_liked(uuid) to authenticated;

-- Follow notification: recipient = followed user
create or replace function public.notify_user_followed(p_followee_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if p_followee_id is null or p_followee_id = auth.uid() then
    return;
  end if;
  insert into public.notifications (user_id, type, actor_id)
  values (p_followee_id, 'follow', auth.uid());
end;
$$;

grant execute on function public.notify_user_followed(uuid) to authenticated;
