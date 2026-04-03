-- =============================================================================
-- NUCLEAR RESET — REMOVES THE ENTIRE DATABASE STRUCTURE (not “data only”)
-- =============================================================================
-- This script DROPS THE WHOLE `public` SCHEMA: all tables, columns, RLS,
-- functions, types — everything. After this, pet_profiles and every other
-- table DOES NOT EXIST until you re-run migrations (supabase db push).
--
-- For “delete rows but keep tables” use: truncate_public_data_only.sql
--
-- WARNING: Irreversible. Also deletes ALL files in app Storage buckets.
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
-- Supabase blocks raw DELETE on storage tables (storage.protect_delete). We
-- temporarily disable triggers, then re-enable. If this step fails, skip it
-- and empty buckets via Dashboard → Storage (select files → delete), or
-- supabase storage commands, then re-run from section 2 only.
-- ---------------------------------------------------------------------------
alter table storage.objects disable trigger all;
delete from storage.objects;
alter table storage.objects enable trigger all;

alter table storage.buckets disable trigger all;
delete from storage.buckets
where id in (
  'profile-picture',
  'background-picture',
  'media-post',
  'media-stories'
);
alter table storage.buckets enable trigger all;

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
