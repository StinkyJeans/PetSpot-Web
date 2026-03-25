"use client";

import { useFeedRouteSnapshot } from "@/lib/navigation/use-route-snapshot";

export default function CachedFeedLoading() {
  const snapshot = useFeedRouteSnapshot();

  if (snapshot?.posts?.length) {
    return (
      <div className="min-h-screen bg-[#F1F8F1]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="h-14 w-full rounded-3xl bg-white/70 shadow-sm" />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_320px]">
            <div className="hidden lg:block h-[520px] rounded-3xl bg-white/70 shadow-sm" />
            <div className="flex flex-col gap-5">
              <div className="h-[110px] rounded-3xl bg-white/80 shadow-sm" />
              {snapshot.posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm"
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
            <div className="hidden lg:block h-[520px] rounded-3xl bg-white/70 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="h-14 w-full animate-pulse rounded-3xl bg-white/70 shadow-sm" />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_320px]">
          <div className="hidden lg:block">
            <div className="h-[520px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
          </div>

          <div>
            <div className="h-[110px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
            <div className="mt-5 h-[170px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />

            <div className="mt-5 flex flex-col gap-5">
              <div className="h-[520px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
              <div className="h-[520px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="h-[520px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
