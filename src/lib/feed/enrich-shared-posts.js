export const sharedPostDetailSelect =
  "id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location)";

/**
 * When the nested embed fails (PostgREST self-FK edge), shared_post_id is still set.
 * Batch-load originals so sharer vs original author resolves.
 */
export async function enrichPostsWithShared(supabase, rows) {
  if (!rows?.length) return rows;
  const need = rows.filter((r) => {
    if (!r.shared_post_id) return false;
    if (r.shared_post == null) return true;
    if (Array.isArray(r.shared_post) && r.shared_post.length === 0) return true;
    return false;
  });
  if (!need.length) return rows;
  const ids = [...new Set(need.map((r) => r.shared_post_id).filter(Boolean))];
  const { data: originals, error } = await supabase.from("posts").select(sharedPostDetailSelect).in("id", ids);
  if (error || !originals?.length) return rows;
  const map = Object.fromEntries(originals.map((o) => [o.id, o]));
  return rows.map((r) => {
    if (!r.shared_post_id || !map[r.shared_post_id]) return r;
    const missing =
      r.shared_post == null || (Array.isArray(r.shared_post) && r.shared_post.length === 0);
    if (!missing) return r;
    return { ...r, shared_post: map[r.shared_post_id] };
  });
}
