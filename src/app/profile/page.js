import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import FeedLeftSidebar from "@/components/feed/feed-left-sidebar";
import FeedTopNav from "@/components/feed/feed-top-nav";
import ProfilePageClient, { ProfileRightPanel } from "@/components/profile/profile-page-client";
import { getEventSectionsForUserId } from "@/lib/events/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);
  const supabase = await getSupabaseServerClient();

  const { data: profile } = await supabase
    .from("pet_profiles")
    .select(
      "id,pet_name,breed,owner_display_name,profile_image_url,background_image_url,about_me,location,favorite_place,favorite_toy,pet_birthday",
    )
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  const { count: followerCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("followee_id", user.id);

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id);

  const { data: posts } = await supabase
    .from("posts")
    .select("id, media_url, image_url, media_kind, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const galleryImageItems = [];
  const galleryVideoItems = [];
  for (const p of posts ?? []) {
    const url = p.media_url || p.image_url;
    if (!url) continue;
    if (p.media_kind === "video") {
      galleryVideoItems.push({ id: p.id, url, kind: "video" });
    } else {
      galleryImageItems.push({ id: p.id, url, kind: "image" });
    }
  }
  const { myEvents, otherEvents } = await getEventSectionsForUserId(supabase, user.id);

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <FeedTopNav active="profile" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <FeedLeftSidebar myEvents={myEvents} otherEvents={otherEvents} />
        </aside>

        <main className="lg:col-span-6">
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
          />
        </main>

        <aside className="lg:col-span-3">
          <ProfileRightPanel
            ownerDisplayName={profile?.owner_display_name ?? ""}
            location={profile?.location ?? ""}
            aboutMe={profile?.about_me ?? ""}
            favoritePlace={profile?.favorite_place ?? ""}
            favoriteToy={profile?.favorite_toy ?? ""}
            petBirthday={profile?.pet_birthday ?? null}
            followerCount={followerCount ?? 0}
            followingCount={followingCount ?? 0}
          />
        </aside>
      </div>
    </div>
  );
}
