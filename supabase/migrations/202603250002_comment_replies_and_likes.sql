-- Threaded replies on post comments
alter table public.post_comments
  add column if not exists parent_id uuid references public.post_comments (id) on delete cascade;

create index if not exists post_comments_parent_id_idx on public.post_comments (post_id, parent_id, created_at);

-- Per-comment likes (separate from post likes)
create table if not exists public.post_comment_likes (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (comment_id, user_id)
);

create index if not exists post_comment_likes_user_id_idx on public.post_comment_likes (user_id);

alter table public.post_comment_likes enable row level security;

drop policy if exists "post_comment_likes_select_authenticated" on public.post_comment_likes;
create policy "post_comment_likes_select_authenticated"
on public.post_comment_likes
for select
to authenticated
using (true);

drop policy if exists "post_comment_likes_insert_own" on public.post_comment_likes;
create policy "post_comment_likes_insert_own"
on public.post_comment_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "post_comment_likes_delete_own" on public.post_comment_likes;
create policy "post_comment_likes_delete_own"
on public.post_comment_likes
for delete
to authenticated
using (auth.uid() = user_id);
