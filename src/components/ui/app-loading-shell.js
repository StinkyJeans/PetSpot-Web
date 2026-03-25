/**
 * Shared page background + skeleton primitives (shimmer lines, not empty pulse).
 */

export function AppLoadingShell({ children, className = "" }) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-[#eef7ef] via-[#f3f8f1] to-[#e8f0e8] ${className}`}
    >
      {children}
    </div>
  );
}

/** Rectangular placeholder (media, large panels) — shimmer fill. */
export function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`skeleton-shimmer rounded-3xl shadow-sm ring-1 ring-emerald-900/[0.06] ${className}`}
    />
  );
}

/** Top nav strip — shimmer. */
export function SkeletonNavBar({ className = "" }) {
  return (
    <div
      className={`skeleton-shimmer border-b border-emerald-200/25 shadow-sm ring-1 ring-emerald-900/[0.05] ${className}`}
    />
  );
}

/** Single horizontal line (text row). */
export function SkeletonLine({ className = "" }) {
  return <div className={`skeleton-shimmer h-3 rounded-full ${className}`} aria-hidden />;
}

/** Rounded avatar / icon placeholder. */
export function SkeletonCircle({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-full ${className}`} aria-hidden />;
}

const DEFAULT_LINE_WIDTHS = ["w-full", "w-[92%]", "w-[70%]", "w-[84%]"];

/** Stacked lines like paragraph / sidebar menu. */
export function SkeletonLineGroup({ lines = 4, className = "", widths = DEFAULT_LINE_WIDTHS }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={widths[i] ?? "w-3/4"} />
      ))}
    </div>
  );
}

/** Feed composer row: avatar + a few lines. */
export function SkeletonComposerRow({ className = "" }) {
  return (
    <div className={`flex gap-3 rounded-3xl border border-emerald-100/60 bg-emerald-50/40 p-4 ring-1 ring-emerald-900/[0.04] ${className}`}>
      <SkeletonCircle className="h-11 w-11 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <SkeletonLine className="h-3.5 w-3/4 max-w-sm" />
        <SkeletonLine className="h-3 w-1/2 max-w-xs" />
      </div>
    </div>
  );
}

/** One post card: author row + body lines + media block. */
export function SkeletonPostCard({ className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-emerald-100/60 bg-emerald-50/40 p-4 ring-1 ring-emerald-900/[0.04] ${className}`}
    >
      <div className="flex gap-3">
        <SkeletonCircle className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <SkeletonLine className="h-3.5 w-44 max-w-[70%]" />
          <SkeletonLine className="h-3 w-28" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-[94%]" />
        <SkeletonLine className="h-3 w-[58%]" />
      </div>
      <SkeletonBlock className="mt-3 h-52 w-full rounded-2xl" />
    </div>
  );
}

/** Narrow sidebar column: title line + menu lines. */
export function SkeletonSidebarColumn({ className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-emerald-100/60 bg-emerald-50/35 p-4 ring-1 ring-emerald-900/[0.04] ${className}`}
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-3.5 w-28" />
          <SkeletonLine className="h-2.5 w-36" />
        </div>
      </div>
      <div className="mt-5 space-y-3 border-t border-emerald-100/50 pt-4">
        <SkeletonLine className="h-3 w-[88%]" />
        <SkeletonLine className="h-3 w-[76%]" />
        <SkeletonLine className="h-3 w-[82%]" />
        <SkeletonLine className="h-3 w-[70%]" />
        <SkeletonLine className="h-3 w-[90%]" />
      </div>
    </div>
  );
}

/** Profile hero: cover bar + avatar + name lines. */
export function SkeletonProfileHero({ className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-emerald-100/60 bg-emerald-50/40 ring-1 ring-emerald-900/[0.04] ${className}`}
    >
      <SkeletonBlock className="h-36 w-full rounded-none rounded-t-3xl" />
      <div className="-mt-12 flex flex-col items-center px-4 pb-6 pt-2">
        <SkeletonCircle className="h-24 w-24 border-4 border-emerald-100/80 bg-emerald-100/20" />
        <div className="mt-3 flex w-full flex-col items-center gap-2">
          <SkeletonLine className="h-4 w-48" />
          <SkeletonLine className="h-3 w-32" />
          <SkeletonLine className="h-3 w-44" />
        </div>
      </div>
    </div>
  );
}

/** Photo grid placeholder. */
export function SkeletonThumbGrid({ count = 6, className = "" }) {
  return (
    <div className={`grid grid-cols-3 gap-2 sm:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="aspect-square rounded-2xl" />
      ))}
    </div>
  );
}
