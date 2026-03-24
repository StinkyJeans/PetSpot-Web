/**
 * Aggregate like/comment/share counts and current user's like/share state for a list of post ids.
 */
export async function aggregatePostEngagement(supabase, postIds, currentUserId) {
  if (!postIds.length) {
    return { counts: {}, liked: new Set(), shared: new Set() };
  }

  const [{ data: likesRows }, { data: commentRows }, { data: shareRows }, { data: myLikes }, { data: myShares }] =
    await Promise.all([
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
      supabase.from("post_shares").select("post_id").in("post_id", postIds),
      supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds)
        .eq("user_id", currentUserId),
      supabase
        .from("post_shares")
        .select("post_id")
        .in("post_id", postIds)
        .eq("user_id", currentUserId),
    ]);

  const counts = {};
  for (const id of postIds) {
    counts[id] = { likes: 0, comments: 0, shares: 0 };
  }
  for (const row of likesRows ?? []) {
    if (counts[row.post_id]) counts[row.post_id].likes += 1;
  }
  for (const row of commentRows ?? []) {
    if (counts[row.post_id]) counts[row.post_id].comments += 1;
  }
  for (const row of shareRows ?? []) {
    if (counts[row.post_id]) counts[row.post_id].shares += 1;
  }

  const liked = new Set((myLikes ?? []).map((r) => r.post_id));
  const shared = new Set((myShares ?? []).map((r) => r.post_id));

  return { counts, liked, shared };
}
