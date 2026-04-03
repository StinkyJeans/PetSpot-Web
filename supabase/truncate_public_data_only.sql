-- =============================================================================
-- DATA ONLY: empty all rows in `public` tables (keeps schema / migrations)
-- =============================================================================
-- Use this when you want a “fresh database” but KEEP tables, RLS, functions.
-- Does NOT touch Storage files. Does NOT touch auth.users.
--
-- Safe to run after migrations are applied. If a table is missing, skip or fix.
-- =============================================================================

do $$
declare
  stmt text;
begin
  select 'truncate table ' || string_agg(format('%I.%I', schemaname, tablename), ', ')
    || ' restart identity cascade'
  into stmt
  from pg_tables
  where schemaname = 'public';

  if stmt is not null then
    execute stmt;
  end if;
end $$;
