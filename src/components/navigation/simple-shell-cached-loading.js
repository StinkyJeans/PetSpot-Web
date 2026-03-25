"use client";

import { useRouteSnapshot } from "@/lib/navigation/use-route-snapshot";

/**
 * @param {{ routeKey: string }} props — pathname for the page, e.g. "/market"
 */
export default function SimpleShellCachedLoading({ routeKey }) {
  const snapshot = useRouteSnapshot(routeKey);

  if (snapshot?.title) {
    return (
      <div className="min-h-screen bg-[#F1F8F1]">
        <div className="h-14 w-full border-b border-emerald-100/80 bg-[#F1F8F1]/95 backdrop-blur" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-zinc-900">{snapshot.title}</h1>
          <p className="mt-2 text-sm text-zinc-600">{snapshot.subtitle ?? ""}</p>
          <div className="mx-auto mt-8 h-10 max-w-[200px] rounded-full bg-white/80 shadow-sm" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <div className="h-14 w-full animate-pulse border-b border-emerald-100/80 bg-white/80" />
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mx-auto h-10 w-48 animate-pulse rounded-lg bg-white/70" />
        <div className="mx-auto mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-white/60" />
        <div className="mx-auto mt-8 h-10 max-w-[200px] animate-pulse rounded-full bg-white/70" />
      </main>
    </div>
  );
}
