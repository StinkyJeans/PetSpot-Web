"use client";

import { useRouteSnapshot } from "@/lib/navigation/use-route-snapshot";

export default function CachedProfileLoading() {
  const snapshot = useRouteSnapshot("/profile");

  if (snapshot?.headline) {
    return (
      <div className="min-h-screen bg-[#F1F8F1]">
        <div className="h-14 w-full border-b border-emerald-100/80 bg-[#F1F8F1]/95 backdrop-blur" />
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr_1fr]">
            <div className="hidden lg:block h-[580px] rounded-3xl bg-white/70 shadow-sm" />
            <div className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                <div
                  className="h-36 w-full bg-emerald-100/80 bg-cover bg-center"
                  style={
                    snapshot.coverUrl
                      ? { backgroundImage: `url(${snapshot.coverUrl})` }
                      : undefined
                  }
                />
                <div className="-mt-12 flex flex-col items-center px-4 pb-6 pt-2">
                  <span className="flex h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-sm">
                    {snapshot.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={snapshot.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-900">
                        {(snapshot.petName || snapshot.headline || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <p className="mt-3 text-center text-lg font-bold text-zinc-900">{snapshot.headline}</p>
                  {snapshot.petName ? (
                    <p className="text-sm text-zinc-600">{snapshot.petName}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-zinc-500">
                    {snapshot.followerCount ?? 0} followers · {snapshot.followingCount ?? 0} following
                  </p>
                </div>
              </div>
              {snapshot.galleryThumbs?.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {snapshot.galleryThumbs.map((thumb) => (
                    <div
                      key={thumb.id}
                      className="aspect-square overflow-hidden rounded-2xl bg-emerald-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[620px] rounded-3xl bg-white/70 shadow-sm" />
              )}
            </div>
            <div className="hidden lg:block h-[580px] rounded-3xl bg-white/70 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="h-14 w-full animate-pulse rounded-3xl bg-white/70 shadow-sm" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr_1fr]">
          <div className="hidden lg:block h-[580px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
          <div className="flex flex-col gap-5">
            <div className="h-[260px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
            <div className="h-[620px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
          </div>
          <div className="hidden lg:block h-[580px] animate-pulse rounded-3xl bg-white/70 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
