"use server";

import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { formatProfileHeadline } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildCurrentPath, buildUserMediaPath } from "@/lib/storage/helpers";

function revalidateFeedAndProfile() {
  revalidateTag("feed");
  revalidateTag("profile");
}

function revalidateFeedOnly() {
  revalidateTag("feed");
}

/**
 * Native <form action={fn}> passes FormData as the first argument only.
 * useActionState passes (prevState, formData).
 */
function getFormData(prevOrForm, maybeForm) {
  if (maybeForm instanceof FormData) return maybeForm;
  if (prevOrForm instanceof FormData) return prevOrForm;
  return null;
}

function getMediaKind(file) {
  if (!file || !file.type) return null;
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export async function createPost(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) {
    return { error: "Invalid request." };
  }
  const user = await requireUser();
  const caption = String(formData.get("caption") ?? "").trim();
  const mediaFile = formData.get("mediaFile");
  const mediaUrlFromClient = String(formData.get("mediaUrl") ?? "").trim();
  const mediaKindFromClient = String(formData.get("mediaKind") ?? "").trim();

  if (!caption) {
    return { error: "Caption is required." };
  }

  const supabase = await getSupabaseServerClient();
  const { data: primaryPet, error: primaryError } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  if (primaryError || !primaryPet?.id) {
    return { error: "Primary pet profile not found. Complete onboarding again." };
  }

  let mediaUrl = null;
  let mediaKind = null;
  if (
    mediaUrlFromClient &&
    (mediaKindFromClient === "image" || mediaKindFromClient === "video")
  ) {
    mediaUrl = mediaUrlFromClient;
    mediaKind = mediaKindFromClient;
  } else if (mediaFile && typeof mediaFile.arrayBuffer === "function" && mediaFile.size > 0) {
    mediaKind = getMediaKind(mediaFile);
    if (!mediaKind) {
      return { error: "Only image or video files are allowed." };
    }

    const bytes = new Uint8Array(await mediaFile.arrayBuffer());
    const folder = mediaKind === "image" ? "images" : "videos";
    const mediaPath = buildUserMediaPath(user.id, folder, mediaFile.name);
    const { error: uploadError } = await supabase.storage
      .from("media-post")
      .upload(mediaPath, bytes, {
        contentType: mediaFile.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message || "Could not upload media." };
    }

    const { data: publicData } = supabase.storage
      .from("media-post")
      .getPublicUrl(mediaPath);
    mediaUrl = publicData?.publicUrl ?? null;
  }

  const { error } = await supabase.from("posts").insert({
    owner_id: user.id,
    pet_profile_id: primaryPet.id,
    caption,
    image_url: mediaKind === "image" ? mediaUrl : null,
    media_url: mediaUrl,
    media_kind: mediaKind,
  });

  if (error) {
    return { error: error.message || "Could not create post." };
  }

  revalidateFeedAndProfile();
  return { error: "" };
}

async function uploadProfileImageVariant({
  supabase,
  userId,
  petProfileId,
  file,
  bucketId,
  currentFolder,
  storageFolder,
  mediaKind,
  profileColumn,
}) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const storagePath = buildUserMediaPath(userId, storageFolder, file.name);
  const currentPath = buildCurrentPath(userId, currentFolder, file.name);

  const { error: storageUploadError } = await supabase.storage
    .from(bucketId)
    .upload(storagePath, bytes, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (storageUploadError) {
    return { error: storageUploadError.message || "Could not upload media." };
  }

  const { error: currentUploadError } = await supabase.storage
    .from(bucketId)
    .upload(currentPath, bytes, {
      contentType: file.type || undefined,
      upsert: true,
    });

  if (currentUploadError) {
    return { error: currentUploadError.message || "Could not set current media." };
  }

  const { data: publicData } = supabase.storage.from(bucketId).getPublicUrl(currentPath);
  const publicUrl = publicData?.publicUrl ?? null;

  const { error: profileError } = await supabase
    .from("pet_profiles")
    .update({ [profileColumn]: publicUrl })
    .eq("id", petProfileId)
    .eq("owner_id", userId);

  if (profileError) {
    return { error: profileError.message || "Could not update profile." };
  }

  await supabase
    .from("pet_profile_media_history")
    .update({ is_current: false })
    .eq("pet_profile_id", petProfileId)
    .eq("media_kind", mediaKind);

  const { error: historyError } = await supabase.from("pet_profile_media_history").insert({
    owner_id: userId,
    pet_profile_id: petProfileId,
    media_kind: mediaKind,
    bucket_id: bucketId,
    object_path: storagePath,
    is_current: true,
  });

  if (historyError) {
    return { error: historyError.message || "Could not save media history." };
  }

  return { error: "" };
}

async function getPrimaryPet(supabase, userId) {
  const { data, error } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("owner_id", userId)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data;
}

export async function updateProfilePicture(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) {
    return { error: "Invalid request." };
  }
  const user = await requireUser();
  const file = formData.get("profileImage");
  if (!file || typeof file.arrayBuffer !== "function" || file.size <= 0) {
    return { error: "Please select a profile image." };
  }

  if (!file.type?.startsWith("image/")) {
    return { error: "Profile picture must be an image file." };
  }

  const supabase = await getSupabaseServerClient();
  const primaryPet = await getPrimaryPet(supabase, user.id);
  if (!primaryPet) return { error: "Primary pet profile not found." };

  const result = await uploadProfileImageVariant({
    supabase,
    userId: user.id,
    petProfileId: primaryPet.id,
    file,
    bucketId: "profile-picture",
    currentFolder: "profile-picture",
    storageFolder: "profile-picture-storage",
    mediaKind: "profile",
    profileColumn: "profile_image_url",
  });

  revalidateFeedAndProfile();
  return result;
}

export async function updateBackgroundPicture(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) {
    return { error: "Invalid request." };
  }
  const user = await requireUser();
  const file = formData.get("backgroundImage");
  if (!file || typeof file.arrayBuffer !== "function" || file.size <= 0) {
    return { error: "Please select a background image." };
  }

  if (!file.type?.startsWith("image/")) {
    return { error: "Background picture must be an image file." };
  }

  const supabase = await getSupabaseServerClient();
  const primaryPet = await getPrimaryPet(supabase, user.id);
  if (!primaryPet) return { error: "Primary pet profile not found." };

  const result = await uploadProfileImageVariant({
    supabase,
    userId: user.id,
    petProfileId: primaryPet.id,
    file,
    bucketId: "background-picture",
    currentFolder: "background-picture",
    storageFolder: "background-picture-storage",
    mediaKind: "background",
    profileColumn: "background_image_url",
  });

  revalidateFeedAndProfile();
  return result;
}

export async function togglePostLike(formData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) return;

  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    await supabase.rpc("notify_post_liked", { p_post_id: postId });
  }
}

export async function deletePost(formData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) {
    return { error: "Missing post." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("owner_id", user.id);

  if (error) {
    return { error: error.message || "Could not delete post." };
  }

  revalidateFeedAndProfile();
  return { ok: true };
}

/** Records a share (one per user per post; duplicates ignored). */
export async function recordPostShare(formData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) return;

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("post_shares").insert({ post_id: postId, user_id: user.id });

  if (error && error.code !== "23505") {
    return { error: error.message || "Could not record share." };
  }

  revalidateFeedOnly();
  return { error: "" };
}

export async function sharePost(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) {
    return { error: "Invalid request." };
  }
  const user = await requireUser();
  const originalPostId = String(formData.get("postId") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  if (!originalPostId) {
    return { error: "Missing post." };
  }

  const supabase = await getSupabaseServerClient();

  const { data: originalPost, error: originalError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", originalPostId)
    .limit(1)
    .maybeSingle();

  if (originalError || !originalPost?.id) {
    return { error: "Post no longer exists." };
  }

  const { data: primaryPet, error: primaryError } = await supabase
    .from("pet_profiles")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  if (primaryError || !primaryPet?.id) {
    return { error: "Primary pet profile not found. Complete onboarding again." };
  }

  const { error: shareInsertError } = await supabase.from("posts").insert({
    owner_id: user.id,
    pet_profile_id: primaryPet.id,
    caption,
    shared_post_id: originalPost.id,
    image_url: null,
    media_url: null,
    media_kind: null,
  });

  if (shareInsertError) {
    return { error: shareInsertError.message || "Could not share post." };
  }

  const { error: metricError } = await supabase
    .from("post_shares")
    .insert({ post_id: originalPost.id, user_id: user.id });

  if (metricError && metricError.code !== "23505") {
    return { error: metricError.message || "Could not record share." };
  }

  revalidateFeedAndProfile();
  return { error: "" };
}

export async function addPostComment(prevOrForm, maybeForm) {
  const formData = getFormData(prevOrForm, maybeForm);
  if (!formData) {
    return { error: "Invalid request." };
  }
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const parentCommentId = String(formData.get("parentCommentId") ?? "").trim() || null;
  if (!postId) {
    return { error: "Missing post." };
  }
  if (!body) {
    return { error: "Comment cannot be empty." };
  }

  const supabase = await getSupabaseServerClient();

  if (parentCommentId) {
    const { data: parentRow, error: parentErr } = await supabase
      .from("post_comments")
      .select("id, post_id")
      .eq("id", parentCommentId)
      .maybeSingle();
    if (parentErr || !parentRow || parentRow.post_id !== postId) {
      return { error: "Invalid reply target." };
    }
  }

  const { data: row, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      body,
      parent_id: parentCommentId,
    })
    .select("id, body, created_at, user_id, parent_id")
    .single();

  if (error || !row) {
    return { error: error?.message || "Could not add comment." };
  }

  if (parentCommentId) {
    await supabase.rpc("notify_comment_replied", {
      p_parent_comment_id: parentCommentId,
      p_reply_comment_id: row.id,
    });
  } else {
    await supabase.rpc("notify_post_commented", {
      p_post_id: postId,
      p_comment_id: row.id,
    });
  }

  const { data: pet } = await supabase
    .from("pet_profiles")
    .select("owner_id, pet_name, owner_display_name, profile_image_url")
    .eq("is_primary", true)
    .eq("owner_id", user.id)
    .maybeSingle();

  const headline = formatProfileHeadline(pet?.owner_display_name, pet?.pet_name);

  return {
    error: "",
    comment: {
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      userId: row.user_id,
      parentId: row.parent_id,
      authorHeadline: headline || "Pet parent",
      authorAvatarUrl: pet?.profile_image_url ?? "",
      likeCount: 0,
      liked: false,
    },
  };
}

export async function togglePostCommentLike(commentId) {
  const user = await requireUser();
  const id = String(commentId ?? "").trim();
  if (!id) {
    return { error: "Missing comment." };
  }

  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("post_comment_likes")
    .select("comment_id")
    .eq("comment_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_comment_likes").delete().eq("comment_id", id).eq("user_id", user.id);
  } else {
    await supabase.from("post_comment_likes").insert({ comment_id: id, user_id: user.id });
    await supabase.rpc("notify_comment_liked", { p_comment_id: id });
  }

  const liked = !existing;

  const { count, error: countErr } = await supabase
    .from("post_comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", id);

  if (countErr) {
    return { error: countErr.message || "Could not load like count." };
  }

  return { error: "", commentId: id, liked, likeCount: count ?? 0 };
}

export async function getPostComments(postId) {
  const user = await requireUser();
  if (!user) return { comments: [], error: "Unauthorized" };

  const supabase = await getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("post_comments")
    .select("id, body, created_at, user_id, parent_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(150);

  if (error) {
    return { comments: [], error: error.message };
  }

  const list = rows ?? [];
  const userIds = [...new Set(list.map((r) => r.user_id))];
  let profileByUser = {};
  if (userIds.length) {
    const { data: pets } = await supabase
      .from("pet_profiles")
      .select("owner_id, pet_name, owner_display_name, profile_image_url")
      .eq("is_primary", true)
      .in("owner_id", userIds);

    profileByUser = Object.fromEntries(
      (pets ?? []).map((p) => [
        p.owner_id,
        {
          headline: formatProfileHeadline(p.owner_display_name, p.pet_name),
          avatarUrl: p.profile_image_url ?? "",
        },
      ]),
    );
  }

  const commentIds = list.map((r) => r.id);
  const likeCountByComment = Object.fromEntries(commentIds.map((cid) => [cid, 0]));
  const likedIds = new Set();

  if (commentIds.length) {
    const { data: aggRows, error: aggErr } = await supabase.rpc("post_comment_like_counts", {
      p_comment_ids: commentIds,
    });

    if (!aggErr) {
      for (const ar of aggRows ?? []) {
        likeCountByComment[ar.comment_id] = Number(ar.like_count) || 0;
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn("[feed] post_comment_like_counts RPC failed, using legacy:", aggErr.message);
      }
      const { data: likeRows } = await supabase
        .from("post_comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);

      for (const lr of likeRows ?? []) {
        likeCountByComment[lr.comment_id] = (likeCountByComment[lr.comment_id] ?? 0) + 1;
        if (lr.user_id === user.id) likedIds.add(lr.comment_id);
      }
    }

    if (!aggErr) {
      const { data: myCommentLikes } = await supabase
        .from("post_comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds)
        .eq("user_id", user.id);

      for (const ml of myCommentLikes ?? []) {
        likedIds.add(ml.comment_id);
      }
    }
  }

  const comments = list.map((r) => {
    const prof = profileByUser[r.user_id];
    return {
      id: r.id,
      body: r.body,
      createdAt: r.created_at,
      userId: r.user_id,
      parentId: r.parent_id,
      authorHeadline: prof?.headline || "Pet parent",
      authorAvatarUrl: prof?.avatarUrl ?? "",
      likeCount: likeCountByComment[r.id] ?? 0,
      liked: likedIds.has(r.id),
    };
  });

  return { comments, error: "" };
}
