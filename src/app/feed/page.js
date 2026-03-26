import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import FeedShell from "@/components/feed/feed-shell";
import FeedStories from "@/components/feed/feed-stories";
import FeedTopNav from "@/components/feed/feed-top-nav";
import PostCard from "@/components/feed/post-card";
import PostComposer from "@/components/feed/post-composer";
import RouteSnapshotWriter from "@/components/navigation/route-snapshot-writer";
import { loadFeedData } from "@/lib/feed/load-feed-data";
import { formatProfileHeadline } from "@/lib/profile";

export default async function FeedPage() {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);

  const { primaryPet, postRows, counts, liked, shared, myEvents, otherEvents, followedEvents } =
    await loadFeedData(user.id);

  const viewerAvatar = primaryPet?.profile_image_url ?? "";
  const sidebarProfileName = formatProfileHeadline(primaryPet?.owner_display_name, primaryPet?.pet_name);
  const feedSnapshot = {
    viewerName: sidebarProfileName,
    viewerAvatar: viewerAvatar,
    posts: postRows.slice(0, 8).map((post) => ({
      id: post.id,
      caption: post.caption ?? "",
      authorHeadline: formatProfileHeadline(
        post?.pet_profiles?.owner_display_name,
        post?.pet_profiles?.pet_name,
      ),
      mediaUrl:
        post.media_url ||
        post.image_url ||
        post?.shared_post?.media_url ||
        post?.shared_post?.image_url ||
        "",
    })),
  };

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <RouteSnapshotWriter routeKey="/feed" snapshot={feedSnapshot} />
      <FeedTopNav active="feed" />

      <FeedShell
        myEvents={myEvents}
        otherEvents={otherEvents}
        followedEvents={followedEvents}
        profileName={sidebarProfileName}
        profileImageUrl={viewerAvatar}
      >
        <FeedStories />
        <div id="create">
          <PostComposer
            viewerName={sidebarProfileName}
            viewerAvatarUrl={viewerAvatar}
          />
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
                  viewerUserId={user.id}
                  viewerCommentLabel={sidebarProfileName}
                />
              );
            })
          )}
        </div>
      </FeedShell>
    </div>
  );
}
