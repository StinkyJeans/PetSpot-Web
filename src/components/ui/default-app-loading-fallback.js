import {
  AppLoadingShell,
  SkeletonCircle,
  SkeletonLine,
  SkeletonLineGroup,
} from "@/components/ui/app-loading-shell";

/** Used by `app/loading.js` and auth/onboarding segment loaders. */
export default function DefaultAppLoadingFallback() {
  return (
    <AppLoadingShell className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-emerald-100/60 bg-emerald-50/50 p-10 shadow-lg ring-1 ring-emerald-900/[0.04]">
        <div className="flex items-center gap-4">
          <SkeletonCircle className="h-12 w-12 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-3.5 w-32" />
            <SkeletonLine className="h-3 w-24" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <SkeletonLine className="h-4 w-full max-w-md" />
          <SkeletonLine className="h-4 w-[94%]" />
          <SkeletonLine className="h-4 w-[78%]" />
        </div>
        <SkeletonLineGroup lines={3} className="mt-6" widths={["w-full", "w-[88%]", "w-[62%]"]} />
        <div className="mt-10 flex flex-wrap gap-3">
          <SkeletonLine className="h-11 w-36 rounded-full" />
          <SkeletonLine className="h-11 w-32 rounded-full" />
        </div>
      </div>
    </AppLoadingShell>
  );
}
