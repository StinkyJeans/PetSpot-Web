"use client";

import ProfileAboutCard from "@/components/profile/profile-about-card";
import ProfileDetailsCard from "@/components/profile/profile-details-card";
import ProfileGallery from "@/components/profile/profile-gallery";
import ProfileHero from "@/components/profile/profile-hero";

export function ProfileRightPanel({
  ownerDisplayName,
  location,
  aboutMe,
  favoritePlace,
  favoriteToy,
  petBirthday,
  followerCount,
  followingCount,
}) {
  return (
    <div className="flex flex-col gap-5">
      <ProfileAboutCard aboutMe={aboutMe} />
      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-emerald-950">Stats</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-zinc-900">{followerCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Followers</p>
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-900">{followingCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Following</p>
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
  );
}

export default function ProfilePageClient({
  ownerDisplayName,
  petName,
  breed,
  location,
  profileImageUrl,
  backgroundImageUrl,
  aboutMe,
  favoritePlace,
  favoriteToy,
  petBirthday,
  followerCount,
  followingCount,
  galleryImageItems,
  galleryVideoItems,
}) {
  function scrollToAbout() {
    document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileHero
        ownerDisplayName={ownerDisplayName}
        petName={petName}
        breed={breed}
        location={location}
        profileImageUrl={profileImageUrl}
        backgroundImageUrl={backgroundImageUrl}
        onEditProfile={scrollToAbout}
      />
      <ProfileGallery imageItems={galleryImageItems} videoItems={galleryVideoItems} />
    </div>
  );
}
