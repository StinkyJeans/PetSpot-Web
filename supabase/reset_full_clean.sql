-- =============================================================================
-- FULL RESET: public schema + Storage (PetSpot)
-- =============================================================================
-- WARNING: Irreversible. Deletes ALL app tables, functions, types in `public`
-- and ALL files in Storage buckets used by this app.
--
-- Does NOT delete auth.users (Supabase Auth). To remove test users, use the
-- Dashboard → Authentication → Users, or the Admin API.
--
-- AFTER RUNNING THIS:
--   1. Re-apply migrations so schema/storage policies return:
--        supabase db push
--      or run each file in supabase/migrations/ in order (SQL Editor).
--   2. Local dev alternative (replays migrations from scratch):
--        supabase db reset
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) Storage: remove objects, then buckets this app created
-- ---------------------------------------------------------------------------
delete from storage.objects;

delete from storage.buckets
where id in (
  'profile-picture',
  'background-picture',
  'media-post',
  'media-stories'
);

-- ---------------------------------------------------------------------------
-- 2) Drop entire public schema (all tables, views, functions, types, etc.)
-- ---------------------------------------------------------------------------
drop schema if exists public cascade;

create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

commit;

-- Done. Run migrations next (see header).
