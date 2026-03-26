import { getEventSectionsForUserId } from "@/lib/events/server";
import { aggregatePostEngagement } from "@/lib/feed/aggregate-engagement";
import { enrichPostsWithShared } from "@/lib/feed/enrich-shared-posts";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const sharedSelect =
  "id,owner_id,shared_post_id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location),shared_post:posts!posts_shared_post_id_fkey(id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location))";
const baseSelect =
  "id,owner_id,shared_post_id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location)";

/**
 * Loads feed data for the authenticated viewer.
 *
 * Note: We cannot wrap Supabase server-client calls in `unstable_cache()` because it reads `cookies()`
 * for auth, and Next.js disallows dynamic data sources inside a cache scope.
 */
export async function loadFeedData(userId) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const supabase = await getSupabaseServerClient();

  const { data: primaryPet } = await supabase
    .from("pet_profiles")
    .select("id,profile_image_url,background_image_url,pet_name,owner_display_name")
    .eq("owner_id", userId)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  let posts = null;
  const withShared = await supabase.from("posts").select(sharedSelect).order("created_at", { ascending: false }).limit(20);

  if (withShared.error) {
    const fallback = await supabase.from("posts").select(baseSelect).order("created_at", { ascending: false }).limit(20);
    posts = await enrichPostsWithShared(supabase, fallback.data ?? []);
  } else {
    posts = await enrichPostsWithShared(supabase, withShared.data ?? []);
  }

  const postRows = posts ?? [];
  const postIds = postRows.map((p) => p.id);
  const { counts, liked, shared } = await aggregatePostEngagement(supabase, postIds, userId);
  const { myEvents, otherEvents, followedEvents } = await getEventSectionsForUserId(supabase, userId);

  if (process.env.NODE_ENV === "development") {
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    console.info(`[feed] data layer ${(t1 - t0).toFixed(0)}ms`);
  }

  return {
    primaryPet,
    postRows,
    counts,
    liked,
    shared,
    myEvents,
    otherEvents,
    followedEvents,
  };
}
