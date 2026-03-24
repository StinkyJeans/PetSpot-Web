"use client";

import { useState } from "react";
import EventSection from "@/components/event/event-section";
import ViewStatsDetailsModal from "@/components/modal/profile/viewStatsDetailsModal";
import ProfileAboutCard from "@/components/profile/profile-about-card";
import ProfileGallery from "@/components/profile/profile-gallery";
import ProfileHero from "@/components/profile/profile-hero";

export function ProfileRightPanel({
  aboutMe,
  myEvents,
  otherEvents,
}) {
  return (
    <div className="flex flex-col gap-5">
      <ProfileAboutCard aboutMe={aboutMe} />
      <EventSection myEvents={myEvents} otherEvents={otherEvents} />
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
  const [showStatsDetails, setShowStatsDetails] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <ProfileHero
        ownerDisplayName={ownerDisplayName}
        petName={petName}
        breed={breed}
        location={location}
        profileImageUrl={profileImageUrl}
        backgroundImageUrl={backgroundImageUrl}
        onViewStatsDetails={() => setShowStatsDetails(true)}
      />
      <ProfileGallery imageItems={galleryImageItems} videoItems={galleryVideoItems} />

      <ViewStatsDetailsModal
        isOpen={showStatsDetails}
        onClose={() => setShowStatsDetails(false)}
        followerCount={followerCount}
        followingCount={followingCount}
        ownerDisplayName={ownerDisplayName}
        location={location}
        favoritePlace={favoritePlace}
        favoriteToy={favoriteToy}
        petBirthday={petBirthday}
      />
    </div>
  );
}
