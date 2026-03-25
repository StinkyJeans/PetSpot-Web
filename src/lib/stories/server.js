import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatProfileHeadline } from "@/lib/profile";

/**
 * Fetch active stories (expires_at > now()) and compute whether the viewer already saw each story.
 *
 * @param {string} viewerUserId - auth.users.id of the currently logged-in viewer
 * @returns {Promise<Array<{
 *   id: string,
 *   ownerId: string,
 *   mediaKind: 'image'|'video',
 *   mediaUrl: string,
 *   caption: string|null,
 *   authorAvatarUrl: string,
 *   authorHeadline: string,
 *   createdAt: string,
 *   expiresAt: string,
 *   viewerHasViewed: boolean,
 * }>>}
 */
export async function getActiveStoriesForViewer(viewerUserId) {
  const supabase = await getSupabaseServerClient();

  const { data: storyRows, error } = await supabase
    .from("user_stories")
    .select("id, owner_id, media_kind, media_url, caption, expires_at, created_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // Fail closed: no stories, but don’t crash the whole feed.
    if (process.env.NODE_ENV === "development") {
      console.warn("[stories] getActiveStoriesForViewer failed:", error.message);
    }
    return [];
  }

  const stories = storyRows ?? [];
  if (!stories.length) return [];

  const ownerIds = [...new Set(stories.map((s) => s.owner_id).filter(Boolean))];
  let profileByOwner = {};

  if (ownerIds.length) {
    const { data: pets } = await supabase
      .from("pet_profiles")
      .select("owner_id, pet_name, owner_display_name, profile_image_url")
      .eq("is_primary", true)
      .in("owner_id", ownerIds);

    profileByOwner = Object.fromEntries(
      (pets ?? []).map((p) => [
        p.owner_id,
        {
          authorHeadline: formatProfileHeadline(p.owner_display_name, p.pet_name),
          authorAvatarUrl: p.profile_image_url ?? "",
        },
      ]),
    );
  }

  const storyIds = stories.map((s) => s.id);
  const viewedSet = new Set();

  if (storyIds.length && viewerUserId) {
    const { data: viewRows } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_user_id", viewerUserId)
      .in("story_id", storyIds);

    for (const vr of viewRows ?? []) {
      viewedSet.add(vr.story_id);
    }
  }

  return stories.map((s) => {
    const prof = profileByOwner[s.owner_id];
    return {
      id: s.id,
      ownerId: s.owner_id,
      mediaKind: s.media_kind,
      mediaUrl: s.media_url,
      caption: s.caption ?? null,
      authorAvatarUrl: prof?.authorAvatarUrl ?? "",
      authorHeadline: prof?.authorHeadline ?? "Story",
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      viewerHasViewed: viewedSet.has(s.id),
    };
  });
}

