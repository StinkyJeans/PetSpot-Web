"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const profilePath = "/profile";

export async function toggleFollowUser(formData) {
  const user = await requireUser();
  const targetUserId = String(formData.get("userId") ?? "").trim();
  if (!targetUserId || targetUserId === user.id) {
    return { error: "Invalid request." };
  }

  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", targetUserId);
    if (error) {
      return { error: error.message || "Could not unfollow." };
    }
  } else {
    const { error } = await supabase.from("user_follows").insert({
      follower_id: user.id,
      followee_id: targetUserId,
    });
    if (error) {
      return { error: error.message || "Could not follow." };
    }
    const { error: notifyError } = await supabase.rpc("notify_user_followed", {
      p_followee_id: targetUserId,
    });
    if (notifyError) {
      return {
        error:
          notifyError.message ||
          "Follow succeeded, but follow notification failed. Run the latest notification migration.",
      };
    }
  }

  revalidatePath(profilePath);
  revalidatePath(`${profilePath}/${targetUserId}`);
  revalidatePath("/feed");
  return { error: "", following: !existing };
}
