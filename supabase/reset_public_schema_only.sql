-- =============================================================================
-- NUCLEAR: DROP ENTIRE `public` SCHEMA (tables removed — not data-only)
-- =============================================================================
-- This REMOVES ALL TABLES AND SCHEMA OBJECTS. You must run migrations again
-- (supabase db push) to recreate pet_profiles and everything else.
--
-- To only clear row data and keep tables, use: truncate_public_data_only.sql
--
-- Use this file when storage steps in reset_full_clean.sql failed, or buckets
-- were already emptied in Dashboard → Storage.
-- =============================================================================

begin;

drop schema if exists public cascade;

create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

commit;
