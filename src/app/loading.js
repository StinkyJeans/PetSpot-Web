"use client";

/**
 * Fallback when a segment has no loading.js (e.g. auth/onboarding).
 * App-shell routes should define their own loading.js for cached previews.
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef7ef,_#dfeadf)] p-6">
      <div className="mx-auto max-w-xl animate-pulse rounded-3xl bg-white/80 p-10 shadow-xl">
        <div className="h-4 w-24 rounded bg-emerald-100/80" />
        <div className="mt-4 h-10 w-4/5 max-w-md rounded bg-zinc-100" />
        <div className="mt-3 h-4 w-full rounded bg-zinc-100" />
        <div className="mt-8 flex gap-3">
          <div className="h-10 w-32 rounded-full bg-emerald-100" />
          <div className="h-10 w-28 rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
