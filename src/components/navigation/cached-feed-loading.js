"use client";

import {
  AppLoadingShell,
  SkeletonComposerRow,
  SkeletonNavBar,
  SkeletonPostCard,
  SkeletonSidebarColumn,
} from "@/components/ui/app-loading-shell";

export default function CachedFeedLoading() {
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
