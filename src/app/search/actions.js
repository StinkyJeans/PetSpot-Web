"use server";

import { requireUser } from "@/lib/auth/server";
import { formatProfileHeadline } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function sanitizeQuery(raw) {
  if (raw == null || typeof raw !== "string") return "";
  return raw
    .trim()
    .slice(0, 80)
    .replace(/\\/g, "")
    .replace(/%/g, "")
    .replace(/_/g, " ")
    .replace(/,/g, " ");
}

/**
 * @returns {Promise<{
 *   users: Array<{ ownerId: string, headline: string, avatarUrl: string, href: string }>,
 *   pages: Array<{ kind: 'event', id: string, title: string, subtitle: string, href: string }>,
 *   communities: Array<{ id: string, name: string, subtitle: string, href: string }>,
 * }>}
 */
export async function searchPack(rawQuery) {
  await requireUser();
  const q = sanitizeQuery(rawQuery);
  if (q.length < 2) {
    return { users: [], pages: [], communities: [] };
  }

  const supabase = await getSupabaseServerClient();
  const pat = `%${q}%`;
  const qLower = q.toLowerCase();

  const petSelect = "owner_id, pet_name, owner_display_name, profile_image_url, breed";

  const [userRes, petNameRes, breedRes, eventRes] = await Promise.all([
    supabase.from("pet_profiles").select(petSelect).eq("is_primary", true).ilike("owner_display_name", pat).limit(8),
    supabase.from("pet_profiles").select(petSelect).eq("is_primary", true).ilike("pet_name", pat).limit(8),
    supabase.from("pet_profiles").select(petSelect).eq("is_primary", true).ilike("breed", pat).limit(8),
    supabase
      .from("events")
      .select("id, purpose, city, country, event_date, event_type")
      .or(`purpose.ilike.${pat},city.ilike.${pat},country.ilike.${pat}`)
      .order("event_date", { ascending: true })
      .limit(8),
  ]);

  /** Owner display name, pet name, or breed — one row per owner (priority: name → pet → breed). */
  const profileByOwner = new Map();
  for (const r of userRes.data ?? []) {
    profileByOwner.set(r.owner_id, r);
  }
  for (const r of petNameRes.data ?? []) {
    if (!profileByOwner.has(r.owner_id)) profileByOwner.set(r.owner_id, r);
  }
  for (const r of breedRes.data ?? []) {
    if (!profileByOwner.has(r.owner_id)) profileByOwner.set(r.owner_id, r);
  }

  const users = Array.from(profileByOwner.values())
    .slice(0, 8)
    .map((r) => ({
      ownerId: r.owner_id,
      headline: formatProfileHeadline(r.owner_display_name, r.pet_name),
      avatarUrl: r.profile_image_url ?? "",
      href: `/profile/${r.owner_id}`,
    }));

  const pages = [];

  for (const e of eventRes.data ?? []) {
    const when = e.event_date ? String(e.event_date) : "";
    pages.push({
      kind: "event",
      id: e.id,
      title: e.purpose?.trim() ? e.purpose.trim().slice(0, 80) : "Event",
      subtitle: [e.city, e.country, when].filter(Boolean).join(" · "),
      href: "/feed",
    });
  }

  const communities = [];
  if (
    qLower.includes("community") ||
    qLower.includes("group") ||
    qLower.includes("hub") ||
    qLower.includes("discuss") ||
    qLower.includes("pack")
  ) {
    communities.push({
      id: "community-hub",
      name: "PetSpot Community",
      subtitle: "Community hub & upcoming groups",
      href: "/community",
    });
  }

  return { users, pages, communities };
}
