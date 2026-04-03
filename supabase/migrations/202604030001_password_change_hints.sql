-- Track last password change (email/password flow) for login hints after failed sign-in.

create table if not exists public.password_change_hints (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  password_changed_at timestamptz not null default timezone('utc', now())
);

create index if not exists password_change_hints_email_lower_idx
  on public.password_change_hints (lower(trim(email)));

alter table public.password_change_hints enable row level security;

drop policy if exists "password_change_hints_insert_own" on public.password_change_hints;
create policy "password_change_hints_insert_own"
on public.password_change_hints
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "password_change_hints_update_own" on public.password_change_hints;
create policy "password_change_hints_update_own"
on public.password_change_hints
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Anonymous login attempts can ask when this email last recorded a password change (hint only).
create or replace function public.password_change_hint_for_email(p_email text)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select password_changed_at
  from public.password_change_hints
  where lower(trim(email)) = lower(trim(p_email))
  limit 1;
$$;

grant execute on function public.password_change_hint_for_email(text) to anon, authenticated;
