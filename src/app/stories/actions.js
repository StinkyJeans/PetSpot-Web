"use server";

import { requireUser } from "@/lib/auth/server";
import { formatProfileHeadline } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getFormData(prevOrForm, maybeForm) {
  if (maybeForm instanceof FormData) return maybeForm;
  if (prevOrForm instanceof FormData) return prevOrForm;
  return null;
}

export async function createStory(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) {
    return { error: "Invalid request." };
  }

  const storyId = String(formData.get("storyId") ?? "").trim() || null;
  const mediaUrl = String(formData.get("mediaUrl") ?? "").trim();
  const mediaKind = String(formData.get("mediaKind") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (!mediaUrl) return { error: "Missing story media URL." };
  if (!["image", "video"].includes(mediaKind)) return { error: "Invalid story media kind." };

  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  // Delete any active story for this user so the strip stays "one story per user".
  await supabase
    .from("user_stories")
    .delete()
    .eq("owner_id", user.id)
    .gt("expires_at", new Date().toISOString());

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error: insertErr } = await supabase
    .from("user_stories")
    .insert({
      id: storyId ?? undefined,
      owner_id: user.id,
      media_kind: mediaKind,
      media_url: mediaUrl,
      caption: caption || null,
      expires_at: expiresAt,
    })
    .select("id, owner_id, media_kind, media_url, caption, created_at, expires_at")
    .single();

  if (insertErr || !inserted) {
    return { error: insertErr?.message || "Could not create story." };
  }

  const { data: pet } = await supabase
    .from("pet_profiles")
    .select("owner_display_name, pet_name, profile_image_url")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  return {
    error: "",
    story: {
      id: inserted.id,
      ownerId: inserted.owner_id,
      mediaKind: inserted.media_kind,
      mediaUrl: inserted.media_url,
      caption: inserted.caption ?? null,
      authorHeadline: formatProfileHeadline(pet?.owner_display_name, pet?.pet_name),
      authorAvatarUrl: pet?.profile_image_url ?? "",
      createdAt: inserted.created_at,
      expiresAt: inserted.expires_at,
      viewerHasViewed: false,
    },
  };
}

export async function recordStoryView(storyId) {
  const id = String(storyId ?? "").trim();
  if (!id) return { error: "Missing story." };

  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from("story_views").insert({
    story_id: id,
    viewer_user_id: user.id,
  });

  // Duplicate views are fine: unique PK handles it.
  if (error && error.code !== "23505") {
    return { error: error.message || "Could not record story view." };
  }

  return { error: "" };
}

