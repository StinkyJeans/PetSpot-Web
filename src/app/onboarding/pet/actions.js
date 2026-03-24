"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createPrimaryPetProfile(_, formData) {
  const user = await requireUser();
  const ownerDisplayName = String(formData.get("ownerDisplayName") ?? "").trim();
  const petName = String(formData.get("petName") ?? "").trim();
  const breed = String(formData.get("breed") ?? "").trim();
  const ageYearsValue = Number(formData.get("ageYears"));

  if (!petName || !breed || Number.isNaN(ageYearsValue) || ageYearsValue < 0) {
    return { error: "Please complete all required fields." };
  }

  const supabase = await getSupabaseServerClient();
  const { data: existingPrimary, error: existingError } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message || "Could not check pet profile." };
  }

  let error = null;
  if (existingPrimary?.id) {
    ({ error } = await supabase
      .from("pet_profiles")
      .update({
        owner_display_name: ownerDisplayName || null,
        pet_name: petName,
        breed,
        age_years: ageYearsValue,
      })
      .eq("id", existingPrimary.id)
      .eq("owner_id", user.id));
  } else {
    ({ error } = await supabase.from("pet_profiles").insert({
      owner_id: user.id,
      owner_display_name: ownerDisplayName || null,
      pet_name: petName,
      breed,
      age_years: ageYearsValue,
      is_primary: true,
    }));
  }

  if (error) {
    return { error: error.message || "Could not save pet profile." };
  }

  redirect("/feed");
}
