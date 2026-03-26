"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBackgroundPicture, updateProfilePicture } from "@/app/feed/actions";
import { formatProfileHeadline } from "@/lib/profile";
import { CheckVerified, MenuAlt03, Plus } from "griddy-icons";
import ProfileFollowRow from "@/components/profile/profile-follow-row";

export default function ProfileHero({
  ownerDisplayName,
  petName,
  breed,
  location,
  profileImageUrl,
  backgroundImageUrl,
  onViewStatsDetails,
  isOwnProfile = true,
  targetUserId = null,
  isFollowing = false,
}) {
  const router = useRouter();
  const [uploadError, setUploadError] = useState("");
  const [isProfilePending, startProfileUpload] = useTransition();
  const [isBackgroundPending, startBackgroundUpload] = useTransition();
  const headline = formatProfileHeadline(ownerDisplayName, petName);

  function handleUpload(file, field, action, startTransition) {
    if (!file) return;
    setUploadError("");
    const formData = new FormData();
    formData.append(field, file);

    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        setUploadError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      {/* Cover */}
      <div className="relative aspect-[21/9] min-h-[140px] bg-gradient-to-br from-emerald-100 to-emerald-50">
        {backgroundImageUrl ? (
          <img
            src={backgroundImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        {isOwnProfile ? (
          <>
            {backgroundImageUrl ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/30 hover:opacity-100">
                <label className="cursor-pointer rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-emerald-900 shadow">
                  {isBackgroundPending ? "Uploading cover..." : "Change cover photo"}
                  <input
                    type="file"
                    name="backgroundImage"
                    accept="image/*"
                    className="hidden"
                    disabled={isBackgroundPending || isProfilePending}
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0];
                      e.currentTarget.value = "";
                      handleUpload(
                        f,
                        "backgroundImage",
                        updateBackgroundPicture,
                        startBackgroundUpload,
                      );
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <label className="flex cursor-pointer flex-col items-center gap-2 text-emerald-900">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-emerald-400 bg-white/80">
                    <Plus size={28} color="#14532d" />
                  </span>
                  <span className="text-center text-sm font-medium">
                    {isBackgroundPending ? "Uploading cover..." : "Upload cover photo"}
                  </span>
                  <input
                    type="file"
                    name="backgroundImage"
                    accept="image/*"
                    className="sr-only"
                    required
                    disabled={isBackgroundPending || isProfilePending}
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0];
                      e.currentTarget.value = "";
                      handleUpload(
                        f,
                        "backgroundImage",
                        updateBackgroundPicture,
                        startBackgroundUpload,
                      );
                    }}
                  />
                </label>
              </div>
            )}
            {isBackgroundPending ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
                <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-emerald-900 shadow">
                  Uploading background picture...
                </span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="relative z-10 -mt-14 px-5 pb-6">
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
              {isOwnProfile ? (
                <>
                  {profileImageUrl ? (
                    <>
                      <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/35 hover:opacity-100">
                        <label className="cursor-pointer rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 shadow">
                          {isProfilePending ? "Uploading..." : "Change"}
                          <input
                            type="file"
                            name="profileImage"
                            accept="image/*"
                            className="hidden"
                            disabled={isProfilePending || isBackgroundPending}
                            onChange={(e) => {
                              const f = e.currentTarget.files?.[0];
                              e.currentTarget.value = "";
                              handleUpload(
                                f,
                                "profileImage",
                                updateProfilePicture,
                                startProfileUpload,
                              );
                            }}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-emerald-50 p-2 text-center">
                      <label className="flex cursor-pointer flex-col items-center gap-1">
                        <Plus size={32} color="#14532d" />
                        <span className="text-[10px] font-medium leading-tight text-emerald-950">
                          {isProfilePending ? "Uploading..." : "Profile photo"}
                        </span>
                        <span className="text-[9px] text-emerald-800/90">You &amp; your pet</span>
                        <input
                          type="file"
                          name="profileImage"
                          accept="image/*"
                          className="sr-only"
                          required
                          disabled={isProfilePending || isBackgroundPending}
                          onChange={(e) => {
                            const f = e.currentTarget.files?.[0];
                            e.currentTarget.value = "";
                            handleUpload(
                              f,
                              "profileImage",
                              updateProfilePicture,
                              startProfileUpload,
                            );
                          }}
                        />
                      </label>
                    </div>
                  )}
                  {isProfilePending ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-emerald-900">
                        Uploading profile picture...
                      </span>
                    </div>
                  ) : null}
                </>
              ) : profileImageUrl ? (
                <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-emerald-900">
                  {headline.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-14 sm:pt-16">
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                {headline}
                <CheckVerified size={22} color="#059669" aria-hidden />
                {breed ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                    {breed}
                  </span>
                ) : null}
                {location ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                    {location}
                  </span>
                ) : null}
              </h1>
              <p className="mt-1 text-xs text-zinc-500">PetSpot profile — one place for you and your pet.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex w-full flex-wrap items-center justify-end gap-2 border-t border-emerald-100/80 pt-4">
          {!isOwnProfile && targetUserId ? (
            <ProfileFollowRow targetUserId={targetUserId} isFollowing={isFollowing} />
          ) : null}
          <button
            type="button"
            onClick={onViewStatsDetails}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            <MenuAlt03 size={14} />
            View Details
          </button>
        </div>
      </div>
      {uploadError ? <p className="px-5 pb-5 text-xs text-red-600">{uploadError}</p> : null}
    </section>
  );
}
