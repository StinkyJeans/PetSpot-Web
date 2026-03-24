-- Unified profile fields (owner + pet on one row). Safe if 005 was skipped.

alter table public.pet_profiles add column if not exists about_me text;
alter table public.pet_profiles add column if not exists location text;
alter table public.pet_profiles add column if not exists favorite_toy text;

alter table public.pet_profiles add column if not exists pet_birthday date;
alter table public.pet_profiles add column if not exists owner_display_name text;
alter table public.pet_profiles add column if not exists favorite_place text;

-- If an older migration added "birthday", move data to pet_birthday and remove it.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pet_profiles'
      and column_name = 'birthday'
  ) then
    update public.pet_profiles
    set pet_birthday = birthday
    where pet_birthday is null and birthday is not null;
    alter table public.pet_profiles drop column birthday;
  end if;
end $$;
