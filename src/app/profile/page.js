import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import FeedLeftSidebar from "@/components/feed/feed-left-sidebar";
import FeedTopNav from "@/components/feed/feed-top-nav";
import ProfilePageClient, { ProfileRightPanel } from "@/components/profile/profile-page-client";
import { formatProfileHeadline } from "@/lib/profile";
import { loadProfileData } from "@/lib/profile/load-profile-cached-data";

export default async function ProfilePage() {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);

  const {
    profile,
    followerCount,
    followingCount,
    postRows,
    counts,
    liked,
    shared,
    myEvents,
    otherEvents,
  } = await loadProfileData(user.id);

  const viewerAvatar = profile?.profile_image_url ?? "";

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
  const sidebarProfileName = formatProfileHeadline(profile?.owner_display_name, profile?.pet_name);

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <FeedTopNav active="profile" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_2fr_1fr]">
        <aside className="hidden lg:block">
          <div className="lg:fixed lg:bottom-4 lg:left-[calc(50%-min(80rem,calc(100vw-2rem))/2)] lg:top-[5.5rem] lg:w-[calc((min(80rem,calc(100vw-2rem))-3rem)/4)] lg:overflow-y-auto">
            <FeedLeftSidebar
              showEventSection={false}
              profileName={sidebarProfileName}
              profileImageUrl={profile?.profile_image_url ?? ""}
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
          />
        </main>

        <aside>
          <div className="lg:fixed lg:bottom-4 lg:right-[calc(50%-min(80rem,calc(100vw-2rem))/2)] lg:top-[5.5rem] lg:w-[calc((min(80rem,calc(100vw-2rem))-3rem)/4)] lg:overflow-y-auto">
            <ProfileRightPanel
              aboutMe={profile?.about_me ?? ""}
              myEvents={myEvents}
              otherEvents={otherEvents}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
