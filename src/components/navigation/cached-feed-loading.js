"use client";

import {
  AppLoadingShell,
  SkeletonComposerRow,
  SkeletonNavBar,
  SkeletonPostCard,
  SkeletonSidebarColumn,
} from "@/components/ui/app-loading-shell";
import { useFeedRouteSnapshot } from "@/lib/navigation/use-route-snapshot";

export default function CachedFeedLoading() {
  const snapshot = useFeedRouteSnapshot();

  if (snapshot?.posts?.length) {
    return (
      <AppLoadingShell>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <SkeletonNavBar className="h-14 w-full rounded-3xl" />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_320px]">
            <SkeletonSidebarColumn className="hidden min-h-[520px] lg:block" />
            <div className="flex flex-col gap-5">
              <SkeletonComposerRow />
              {snapshot.posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-3xl border border-emerald-100/90 bg-emerald-50/80 p-4 shadow-sm ring-1 ring-emerald-900/[0.04]"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {post.authorHeadline || "PetSpot"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                    {post.caption || "Loading post..."}
                  </p>
                  {post.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.mediaUrl} alt="" className="mt-3 h-56 w-full rounded-2xl object-cover" />
                  ) : null}
                </article>
              ))}
            </div>
            <SkeletonSidebarColumn className="hidden min-h-[520px] lg:block" />
          </div>
        </div>
      </AppLoadingShell>
    );
  }

  return (
    <AppLoadingShell>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <SkeletonNavBar className="h-14 w-full rounded-3xl" />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_320px]">
          <SkeletonSidebarColumn className="hidden lg:block" />

          <div className="flex flex-col gap-5">
            <SkeletonComposerRow />
            <SkeletonPostCard />
            <SkeletonPostCard />
          </div>

          <SkeletonSidebarColumn className="hidden lg:block" />
        </div>
      </div>
    </AppLoadingShell>
  );
}
