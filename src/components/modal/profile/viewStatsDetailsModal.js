"use client";

import ProfileDetailsCard from "@/components/profile/profile-details-card";

export default function ViewStatsDetailsModal({
  isOpen,
  onClose,
  followerCount,
  followingCount,
  ownerDisplayName,
  location,
  favoritePlace,
  favoriteToy,
  petBirthday,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Stats and Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-auto pr-1">
          <section className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-950">Stats</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-zinc-900">{followerCount}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Followers
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900">{followingCount}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Following
                </p>
              </div>
            </div>
          </section>

          <ProfileDetailsCard
            ownerDisplayName={ownerDisplayName}
            location={location}
            favoritePlace={favoritePlace}
            favoriteToy={favoriteToy}
            petBirthday={petBirthday}
          />
        </div>
      </div>
    </div>
  );
}
