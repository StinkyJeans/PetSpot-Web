import { getEventSectionsForUserId } from "@/lib/events/server";
import { aggregatePostEngagement } from "@/lib/feed/aggregate-engagement";
import { enrichPostsWithShared } from "@/lib/feed/enrich-shared-posts";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const profilePostsSelect =
  "id,owner_id,shared_post_id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location),shared_post:posts!posts_shared_post_id_fkey(id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location))";
const profilePostsBaseSelect =
  "id,owner_id,shared_post_id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location)";

async function loadFollowCounts(supabase, profileUserId) {
  const { data: countRows, error } = await supabase.rpc("follow_counts_for_user", {
    target_user: profileUserId,
  });
  if (error || !countRows?.length) {
    return { followerCount: 0, followingCount: 0 };
  }
  const row = countRows[0];
  return {
    followerCount: Number(row.followers ?? 0),
    followingCount: Number(row.following ?? 0),
  };
}

/**
 * @param {string} profileUserId — Owner whose profile is shown
 * @param {string} viewerUserId — Logged-in user (for likes/engagement state)
 */
export async function loadProfileDataForUser(profileUserId, viewerUserId) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const supabase = await getSupabaseServerClient();

  const { data: profile } = await supabase
    .from("pet_profiles")
    .select(
      "id,pet_name,breed,owner_display_name,profile_image_url,background_image_url,about_me,location,favorite_place,favorite_toy,pet_birthday",
    )
    .eq("owner_id", profileUserId)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  const { followerCount, followingCount } = await loadFollowCounts(supabase, profileUserId);

  let isFollowing = false;
  if (profileUserId !== viewerUserId) {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", viewerUserId)
      .eq("followee_id", profileUserId)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }

  let posts = null;
  const withShared = await supabase
    .from("posts")
    .select(profilePostsSelect)
    .eq("owner_id", profileUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (withShared.error) {
    const fallback = await supabase
      .from("posts")
      .select(profilePostsBaseSelect)
      .eq("owner_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(100);
    posts = await enrichPostsWithShared(supabase, fallback.data ?? []);
  } else {
    posts = await enrichPostsWithShared(supabase, withShared.data ?? []);
  }

  const postRows = posts ?? [];
  const postIds = postRows.map((p) => p.id);
  const { counts, liked, shared } = await aggregatePostEngagement(supabase, postIds, viewerUserId);
  const { myEvents, otherEvents, followedEvents } = await getEventSectionsForUserId(supabase, profileUserId);

  if (process.env.NODE_ENV === "development") {
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    console.info(`[profile] data layer ${(t1 - t0).toFixed(0)}ms`);
  }

  return {
    profile,
    profileUserId,
    isOwnProfile: profileUserId === viewerUserId,
    isFollowing,
    followerCount,
    followingCount,
    postRows,
    counts,
    liked,
    shared,
    myEvents,
    otherEvents,
    followedEvents,
  };
}

export async function loadProfileData(userId) {
  return loadProfileDataForUser(userId, userId);
}
