"use client";

import {
  AppLoadingShell,
  SkeletonBlock,
  SkeletonNavBar,
  SkeletonProfileHero,
  SkeletonSidebarColumn,
  SkeletonThumbGrid,
} from "@/components/ui/app-loading-shell";
import { useRouteSnapshot } from "@/lib/navigation/use-route-snapshot";

export default function CachedProfileLoading() {
  const snapshot = useRouteSnapshot("/profile");

  if (snapshot?.headline) {
    return (
      <AppLoadingShell>
        <SkeletonNavBar className="h-14 w-full rounded-none" />
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr_1fr]">
            <SkeletonSidebarColumn className="hidden min-h-[580px] lg:block" />
            <div className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-3xl border border-emerald-100/90 bg-emerald-50/90 shadow-sm ring-1 ring-emerald-900/[0.04]">
                <div
                  className="h-36 w-full bg-emerald-200/40 bg-cover bg-center"
                  style={
                    snapshot.coverUrl
                      ? { backgroundImage: `url(${snapshot.coverUrl})` }
                      : undefined
                  }
                />
                <div className="-mt-12 flex flex-col items-center px-4 pb-6 pt-2">
                  <span className="flex h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-emerald-100/80 bg-emerald-100/50 shadow-sm">
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
                      className="aspect-square overflow-hidden rounded-2xl bg-emerald-100/40 ring-1 ring-emerald-900/[0.05]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 rounded-3xl border border-emerald-100/60 bg-emerald-50/35 p-4 ring-1 ring-emerald-900/[0.04]">
                  <SkeletonBlock className="h-4 w-40 rounded-md" />
                  <SkeletonBlock className="h-3 w-56 rounded-md" />
                  <SkeletonThumbGrid count={6} />
                </div>
              )}
            </div>
            <SkeletonSidebarColumn className="hidden min-h-[580px] lg:block" />
          </div>
        </div>
      </AppLoadingShell>
    );
  }

  return (
    <AppLoadingShell>
      <SkeletonNavBar className="h-14 w-full rounded-none" />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr_1fr]">
          <SkeletonSidebarColumn className="hidden lg:block" />
          <div className="flex flex-col gap-5">
            <SkeletonProfileHero />
            <div className="space-y-3 rounded-3xl border border-emerald-100/60 bg-emerald-50/35 p-4 ring-1 ring-emerald-900/[0.04]">
              <SkeletonBlock className="h-4 w-36 rounded-md" />
              <SkeletonBlock className="h-3 w-52 rounded-md" />
            </div>
            <SkeletonThumbGrid count={8} />
          </div>
          <SkeletonSidebarColumn className="hidden lg:block" />
        </div>
      </div>
    </AppLoadingShell>
  );
}
