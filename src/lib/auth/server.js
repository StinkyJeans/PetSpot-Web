import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function hasPrimaryPetProfile(userId) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("owner_id", userId)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data?.id);
}

export async function requirePrimaryPetProfile(userId) {
  const hasPrimary = await hasPrimaryPetProfile(userId);

  if (!hasPrimary) {
    redirect("/onboarding/pet");
  }
}
