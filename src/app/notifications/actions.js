"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireUser } from "@/lib/auth/server";
import { formatProfileHeadline } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const NOTIFICATION_SELECT =
  "id, type, actor_id, post_id, comment_id, parent_comment_id, event_id, event_title, event_when, event_place, conversation_id, message_id, read_at, created_at";

/**
 * @returns {Promise<Array<{
 *   id: string,
 *   type: string,
 *   actorId: string,
 *   postId: string | null,
 *   commentId: string | null,
 *   parentCommentId: string | null,
 *   eventId: string | null,
 *   eventTitle: string,
 *   eventWhen: string,
 *   eventPlace: string,
 *   conversationId: string | null,
 *   messageId: string | null,
 *   readAt: string | null,
 *   createdAt: string,
 *   isFollowBack: boolean,
 *   actorHeadline: string,
 *   actorAvatarUrl: string
 * }>>}
 */
export async function fetchNotifications({ limit = 40 } = {}) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !rows?.length) {
    return [];
  }

  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const { data: pets } = await supabase
    .from("pet_profiles")
    .select("owner_id, pet_name, owner_display_name, profile_image_url")
    .eq("is_primary", true)
    .in("owner_id", actorIds);

  const actorById = Object.fromEntries(
    (pets ?? []).map((p) => [
      p.owner_id,
      {
        headline: formatProfileHeadline(p.owner_display_name, p.pet_name),
        avatarUrl: p.profile_image_url ?? "",
      },
    ]),
  );

  const followActorIds = [...new Set(rows.filter((r) => r.type === "follow").map((r) => r.actor_id))];
  let followBackSet = new Set();
  if (followActorIds.length) {
    const { data: backRows } = await supabase
      .from("user_follows")
      .select("followee_id")
      .eq("follower_id", user.id)
      .in("followee_id", followActorIds);
    followBackSet = new Set((backRows ?? []).map((r) => r.followee_id));
  }

  return rows.map((r) => {
    const a = actorById[r.actor_id];
    return {
      id: r.id,
      type: r.type,
      actorId: r.actor_id,
      postId: r.post_id,
      commentId: r.comment_id,
      parentCommentId: r.parent_comment_id,
      eventId: r.event_id,
      eventTitle: r.event_title ?? "",
      eventWhen: r.event_when ?? "",
      eventPlace: r.event_place ?? "",
      conversationId: r.conversation_id,
      messageId: r.message_id,
      readAt: r.read_at,
      createdAt: r.created_at,
      isFollowBack: r.type === "follow" && followBackSet.has(r.actor_id),
      actorHeadline: a?.headline ?? "Someone",
      actorAvatarUrl: a?.avatarUrl ?? "",
    };
  });
}

/** Message-type notifications only (for Messages nav dropdown). */
export async function fetchMessageNotifications({ limit = 40 } = {}) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", user.id)
    .eq("type", "message")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !rows?.length) {
    return [];
  }

  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const { data: pets } = await supabase
    .from("pet_profiles")
    .select("owner_id, pet_name, owner_display_name, profile_image_url")
    .eq("is_primary", true)
    .in("owner_id", actorIds);

  const actorById = Object.fromEntries(
    (pets ?? []).map((p) => [
      p.owner_id,
      {
        headline: formatProfileHeadline(p.owner_display_name, p.pet_name),
        avatarUrl: p.profile_image_url ?? "",
      },
    ]),
  );

  return rows.map((r) => {
    const a = actorById[r.actor_id];
    return {
      id: r.id,
      type: r.type,
      actorId: r.actor_id,
      postId: r.post_id,
      commentId: r.comment_id,
      parentCommentId: r.parent_comment_id,
      eventId: r.event_id,
      eventTitle: r.event_title ?? "",
      eventWhen: r.event_when ?? "",
      eventPlace: r.event_place ?? "",
      conversationId: r.conversation_id,
      messageId: r.message_id,
      readAt: r.read_at,
      createdAt: r.created_at,
      isFollowBack: false,
      actorHeadline: a?.headline ?? "Someone",
      actorAvatarUrl: a?.avatarUrl ?? "",
    };
  });
}

export async function getUnreadNotificationCount() {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Bell badge: unread non-message notifications.
 * Messages badge: distinct people (actors) with unread `message` notifications.
 */
export async function getUnreadNotificationBadgeCounts() {
  const user = await getCurrentUser();
  if (!user) {
    return { bellCount: 0, messagePeopleCount: 0 };
  }

  const supabase = await getSupabaseServerClient();

  const { count: bellCount, error: bellErr } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)
    .neq("type", "message");

  if (bellErr) {
    return { bellCount: 0, messagePeopleCount: 0 };
  }

  const { data: msgRows, error: msgErr } = await supabase
    .from("notifications")
    .select("actor_id")
    .eq("user_id", user.id)
    .is("read_at", null)
    .eq("type", "message");

  if (msgErr) {
    return { bellCount: bellCount ?? 0, messagePeopleCount: 0 };
  }

  const messagePeopleCount = new Set((msgRows ?? []).map((r) => r.actor_id).filter(Boolean)).size;

  return { bellCount: bellCount ?? 0, messagePeopleCount };
}

export async function markNotificationsRead(notificationIds) {
  const user = await requireUser();
  const ids = Array.isArray(notificationIds) ? notificationIds.filter(Boolean) : [];
  if (!ids.length) return { ok: true };

  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .in("id", ids);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/feed");
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/feed");
  return { ok: true };
}

export async function markAllMessageNotificationsRead() {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .eq("type", "message")
    .is("read_at", null);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/feed");
  revalidatePath("/messages");
  return { ok: true };
}
