"use client";

import {
  AppLoadingShell,
  SkeletonLine,
  SkeletonLineGroup,
  SkeletonNavBar,
} from "@/components/ui/app-loading-shell";
import { useRouteSnapshot } from "@/lib/navigation/use-route-snapshot";

/**
 * @param {{ routeKey: string }} props — pathname for the page, e.g. "/market"
 */
export default function SimpleShellCachedLoading({ routeKey }) {
  const snapshot = useRouteSnapshot(routeKey);

  if (snapshot?.title) {
    return (
      <AppLoadingShell>
        <SkeletonNavBar className="h-14 w-full rounded-none" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-zinc-900">{snapshot.title}</h1>
          <p className="mt-2 text-sm text-zinc-600">{snapshot.subtitle ?? ""}</p>
          <div className="mx-auto mt-10 flex max-w-xs flex-col items-center gap-2">
            <SkeletonLine className="h-11 w-full rounded-full" />
            <SkeletonLine className="h-11 w-4/5 rounded-full" />
          </div>
        </main>
      </AppLoadingShell>
    );
  }

  return (
    <AppLoadingShell>
      <SkeletonNavBar className="h-14 w-full rounded-none" />
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-12">
        <div className="w-full space-y-3">
          <SkeletonLine className="mx-auto h-8 w-56 rounded-lg" />
          <SkeletonLine className="mx-auto h-4 w-72 max-w-full" />
          <SkeletonLine className="mx-auto h-4 w-64 max-w-full" />
        </div>
        <SkeletonLineGroup
          lines={3}
          className="mt-8 w-full max-w-sm"
          widths={["w-full", "w-[92%]", "w-[55%]"]}
        />
        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <SkeletonLine className="h-11 w-full rounded-full" />
          <SkeletonLine className="h-11 w-4/5 rounded-full" />
        </div>
      </main>
    </AppLoadingShell>
  );
}
