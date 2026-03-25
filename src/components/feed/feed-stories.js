import { requireUser } from "@/lib/auth/server";
import { getActiveStoriesForViewer } from "@/lib/stories/server";
import FeedStoriesClient from "@/components/feed/feed-stories-client";

export default async function FeedStories() {
  const user = await requireUser();
  const stories = await getActiveStoriesForViewer(user.id);

  return (
    <FeedStoriesClient viewerUserId={user.id} initialStories={stories} />
  );
}
