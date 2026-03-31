-- Secure profile lookup for messaging (avoids RLS misses on pet_profiles)

create or replace function public.public_profiles_for_users(p_user_ids uuid[])
returns table (
  owner_id uuid,
  owner_display_name text,
  pet_name text,
  profile_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (p.owner_id)
    p.owner_id,
    p.owner_display_name,
    p.pet_name,
    p.profile_image_url
  from public.pet_profiles p
  where p.owner_id = any (coalesce(p_user_ids, '{}'))
  order by p.owner_id, p.is_primary desc, p.created_at asc;
$$;

grant execute on function public.public_profiles_for_users(uuid[]) to authenticated;

