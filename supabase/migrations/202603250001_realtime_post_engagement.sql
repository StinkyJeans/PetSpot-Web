-- Broadcast INSERT/DELETE on engagement tables to Supabase Realtime subscribers (RLS still applies).
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.post_comments;
alter publication supabase_realtime add table public.post_shares;
