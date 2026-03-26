import { notFound, redirect } from "next/navigation";
import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import FeedLeftSidebar from "@/components/feed/feed-left-sidebar";
import FeedTopNav from "@/components/feed/feed-top-nav";
import ProfilePageClient, { ProfileRightPanel } from "@/components/profile/profile-page-client";
import { formatProfileHeadline } from "@/lib/profile";
import { loadProfileDataForUser } from "@/lib/profile/load-profile-cached-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export default async function OtherUserProfilePage({ params }) {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);
  const { userId: raw } = await params;
  const profileUserId = String(raw ?? "");
  if (!isUuid(profileUserId)) notFound();
  if (profileUserId === user.id) {
    redirect("/profile");
  }

  const supabase = await getSupabaseServerClient();
  const { data: viewerPet } = await supabase
    .from("pet_profiles")
    .select("owner_display_name, pet_name, profile_image_url")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  const viewerSidebarName = formatProfileHeadline(viewerPet?.owner_display_name, viewerPet?.pet_name);
  const viewerAvatar = viewerPet?.profile_image_url ?? "";

  const data = await loadProfileDataForUser(profileUserId, user.id);
  if (!data.profile) notFound();

  const { profile, followerCount, followingCount, postRows, counts, liked, shared, myEvents, otherEvents, isFollowing } =
    data;
  const { followedEvents = [] } = data;

  const galleryImageItems = [];
  const galleryVideoItems = [];
  for (const p of postRows) {
    const url = p.media_url || p.image_url || p.shared_post?.media_url || p.shared_post?.image_url;
    if (!url) continue;
    const kind = p.media_kind || p.shared_post?.media_kind;
    if (kind === "video") {
      galleryVideoItems.push({ id: p.id, url, kind: "video" });
    } else {
      galleryImageItems.push({ id: p.id, url, kind: "image" });
    }
  }

  const postFeedItems = postRows.map((post) => {
    const c = counts[post.id] ?? { likes: 0, comments: 0, shares: 0 };
    return {
      post,
      likeCount: c.likes,
      commentCount: c.comments,
      shareCount: c.shares,
      liked: liked.has(post.id),
      shared: shared.has(post.id),
    };
  });

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <FeedTopNav active="profile" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_2fr_1fr]">
        <aside className="hidden lg:block">
          <div className="lg:fixed lg:bottom-4 lg:left-[calc(50%-min(80rem,calc(100vw-2rem))/2)] lg:top-[5.5rem] lg:w-[calc((min(80rem,calc(100vw-2rem))-3rem)/4)] lg:overflow-y-auto">
            <FeedLeftSidebar
              showEventSection={false}
              profileName={viewerSidebarName}
              profileImageUrl={viewerAvatar}
            />
          </div>
        </aside>

        <main>
          <ProfilePageClient
            ownerDisplayName={profile?.owner_display_name ?? ""}
            petName={profile?.pet_name ?? "Pet"}
            breed={profile?.breed ?? ""}
            location={profile?.location ?? ""}
            profileImageUrl={profile?.profile_image_url ?? ""}
            backgroundImageUrl={profile?.background_image_url ?? ""}
            aboutMe={profile?.about_me ?? ""}
            favoritePlace={profile?.favorite_place ?? ""}
            favoriteToy={profile?.favorite_toy ?? ""}
            petBirthday={profile?.pet_birthday ?? null}
            followerCount={followerCount ?? 0}
            followingCount={followingCount ?? 0}
            galleryImageItems={galleryImageItems}
            galleryVideoItems={galleryVideoItems}
            postFeedItems={postFeedItems}
            viewerUserId={user.id}
            viewerPetAvatarUrl={viewerAvatar}
            isOwnProfile={false}
            profileUserId={profileUserId}
            isFollowing={isFollowing}
          />
        </main>

        <aside>
          <div className="lg:fixed lg:bottom-4 lg:right-[calc(50%-min(80rem,calc(100vw-2rem))/2)] lg:top-[5.5rem] lg:w-[calc((min(80rem,calc(100vw-2rem))-3rem)/4)] lg:overflow-y-auto">
            <ProfileRightPanel
              aboutMe={profile?.about_me ?? ""}
              myEvents={myEvents}
              otherEvents={otherEvents}
              followedEvents={followedEvents}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
