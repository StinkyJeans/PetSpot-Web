"use client";

export default function FeedLoading() {
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

