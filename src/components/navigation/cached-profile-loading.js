"use client";

import {
  AppLoadingShell,
  SkeletonBlock,
  SkeletonNavBar,
  SkeletonProfileHero,
  SkeletonSidebarColumn,
  SkeletonThumbGrid,
} from "@/components/ui/app-loading-shell";

export default function CachedProfileLoading() {
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
