/**
 * Aggregate like/comment/share counts and current user's like/share state for a list of post ids.
 * Uses SQL aggregation (RPC) to avoid transferring one row per engagement row.
 */
async function aggregatePostEngagementLegacy(supabase, postIds, currentUserId) {
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

export async function aggregatePostEngagement(supabase, postIds, currentUserId) {
  if (!postIds.length) {
    return { counts: {}, liked: new Set(), shared: new Set() };
  }

  const [{ data: countRows, error: countErr }, { data: myLikes }, { data: myShares }] = await Promise.all([
    supabase.rpc("feed_post_engagement_counts", { p_post_ids: postIds }),
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

  if (countErr) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[feed] feed_post_engagement_counts RPC failed, using legacy aggregate:", countErr.message);
    }
    return aggregatePostEngagementLegacy(supabase, postIds, currentUserId);
  }

  const counts = {};
  for (const id of postIds) {
    counts[id] = { likes: 0, comments: 0, shares: 0 };
  }
  for (const row of countRows ?? []) {
    if (counts[row.post_id]) {
      counts[row.post_id].likes = Number(row.like_count) || 0;
      counts[row.post_id].comments = Number(row.comment_count) || 0;
      counts[row.post_id].shares = Number(row.share_count) || 0;
    }
  }

  const liked = new Set((myLikes ?? []).map((r) => r.post_id));
  const shared = new Set((myShares ?? []).map((r) => r.post_id));

  return { counts, liked, shared };
}
