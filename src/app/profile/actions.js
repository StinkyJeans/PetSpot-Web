"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getFormData(prevOrForm, maybeForm) {
  if (maybeForm instanceof FormData) return maybeForm;
  if (prevOrForm instanceof FormData) return prevOrForm;
  return null;
}

/** Primary unified profile row (owner + pet) for this user. */
async function getPrimaryProfileId(supabase, userId) {
  const { data, error } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("owner_id", userId)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data.id;
}

export async function updatePetAbout(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) return { error: "Invalid request." };
  const user = await requireUser();
  const about_me = String(formData.get("about_me") ?? "").trim();
  const supabase = await getSupabaseServerClient();
  const profileId = await getPrimaryProfileId(supabase, user.id);
  if (!profileId) return { error: "Profile not found. Complete onboarding first." };

  const { error } = await supabase
    .from("pet_profiles")
    .update({ about_me: about_me || null })
    .eq("id", profileId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message || "Could not update bio." };
  revalidatePath("/profile");
  return { error: "" };
}

export async function updatePetDetails(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) return { error: "Invalid request." };
  const user = await requireUser();
  const owner_display_name = String(formData.get("owner_display_name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const favorite_place = String(formData.get("favorite_place") ?? "").trim();
  const favorite_toy = String(formData.get("favorite_toy") ?? "").trim();
  const petBirthdayRaw = String(formData.get("pet_birthday") ?? "").trim();

  const supabase = await getSupabaseServerClient();
  const profileId = await getPrimaryProfileId(supabase, user.id);
  if (!profileId) return { error: "Profile not found. Complete onboarding first." };

  let pet_birthday = null;
  if (petBirthdayRaw) {
    const d = new Date(petBirthdayRaw);
    if (!Number.isNaN(d.getTime())) {
      pet_birthday = petBirthdayRaw;
    }
  }

  const { error } = await supabase
    .from("pet_profiles")
    .update({
      owner_display_name: owner_display_name || null,
      location: location || null,
      favorite_place: favorite_place || null,
      favorite_toy: favorite_toy || null,
      pet_birthday,
    })
    .eq("id", profileId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message || "Could not update details." };
  revalidatePath("/profile");
  return { error: "" };
}
