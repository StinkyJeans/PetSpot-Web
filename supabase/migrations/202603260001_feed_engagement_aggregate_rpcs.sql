  -- Compact counts for feed engagement (avoids transferring one row per like/comment/share)
  create or replace function public.feed_post_engagement_counts(p_post_ids uuid[])
  returns table (post_id uuid, like_count bigint, comment_count bigint, share_count bigint)
  language sql
  stable
  security invoker
  set search_path = public
  as $$
    with ids as (select unnest(p_post_ids) as id)
    select
      ids.id,
      coalesce(lc.c, 0::bigint),
      coalesce(cc.c, 0::bigint),
      coalesce(sc.c, 0::bigint)
    from ids
    left join (
      select pl.post_id, count(*)::bigint as c
      from post_likes pl
      where pl.post_id = any(p_post_ids)
      group by pl.post_id
    ) lc on lc.post_id = ids.id
    left join (
      select pc.post_id, count(*)::bigint as c
      from post_comments pc
      where pc.post_id = any(p_post_ids)
      group by pc.post_id
    ) cc on cc.post_id = ids.id
    left join (
      select ps.post_id, count(*)::bigint as c
      from post_shares ps
      where ps.post_id = any(p_post_ids)
      group by ps.post_id
    ) sc on sc.post_id = ids.id;
  $$;

  grant execute on function public.feed_post_engagement_counts(uuid[]) to authenticated;

  -- Per-comment like totals (avoids one row per like in JS)
  create or replace function public.post_comment_like_counts(p_comment_ids uuid[])
  returns table (comment_id uuid, like_count bigint)
  language sql
  stable
  security invoker
  set search_path = public
  as $$
    select pcl.comment_id, count(*)::bigint
    from post_comment_likes pcl
    where pcl.comment_id = any(p_comment_ids)
    group by pcl.comment_id;
  $$;

  grant execute on function public.post_comment_like_counts(uuid[]) to authenticated;
