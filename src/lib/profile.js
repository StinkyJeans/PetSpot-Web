/**
 * The `pet_profiles` table stores one unified profile per user: the owner + their primary pet.
 * (Legacy name kept for FK stability with posts and media history.)
 */

export function formatProfileHeadline(ownerDisplayName, petName) {
  const o = ownerDisplayName?.trim();
  const p = petName?.trim();
  if (o && p) return `${o} & ${p}`;
  if (p) return p;
  if (o) return o;
  return "Profile";
}
