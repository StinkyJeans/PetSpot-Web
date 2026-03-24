import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import FeedShell from "@/components/feed/feed-shell";
import FeedStories from "@/components/feed/feed-stories";
import FeedTopNav from "@/components/feed/feed-top-nav";
import PostCard from "@/components/feed/post-card";
import PostComposer from "@/components/feed/post-composer";
import { getEventSectionsForUserId } from "@/lib/events/server";
import { aggregatePostEngagement } from "@/lib/feed/aggregate-engagement";
import { formatProfileHeadline } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);
  const supabase = await getSupabaseServerClient();

  const { data: primaryPet } = await supabase
    .from("pet_profiles")
    .select("id,profile_image_url,background_image_url,pet_name,owner_display_name")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id,caption,image_url,media_url,media_kind,created_at,pet_profiles(pet_name,breed,profile_image_url,owner_display_name,location)",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const postRows = posts ?? [];
  const postIds = postRows.map((p) => p.id);
  const { counts, liked, shared } = await aggregatePostEngagement(supabase, postIds, user.id);
  const { myEvents, otherEvents } = await getEventSectionsForUserId(supabase, user.id);

  const viewerAvatar = primaryPet?.profile_image_url ?? "";
  const sidebarProfileName = formatProfileHeadline(primaryPet?.owner_display_name, primaryPet?.pet_name);

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <FeedTopNav active="feed" />

      <FeedShell
        myEvents={myEvents}
        otherEvents={otherEvents}
        profileName={sidebarProfileName}
        profileImageUrl={viewerAvatar}
      >
        <FeedStories />
        <div id="create">
          <PostComposer />
        </div>
        <div className="flex flex-col gap-5">
          {postRows.length === 0 ? (
            <p className="rounded-3xl border border-emerald-100 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
              No posts yet. Create your first post above.
            </p>
          ) : (
            postRows.map((post) => {
              const c = counts[post.id] ?? { likes: 0, comments: 0, shares: 0 };
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  likeCount={c.likes}
                  commentCount={c.comments}
                  shareCount={c.shares}
                  liked={liked.has(post.id)}
                  shared={shared.has(post.id)}
                  viewerPetAvatarUrl={viewerAvatar}
                />
              );
            })
          )}
        </div>
      </FeedShell>
    </div>
  );
}
