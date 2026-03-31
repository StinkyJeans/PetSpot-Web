import { formatProfileHeadline } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? ""),
  );
}

function buildPartnerMap(rows) {
  const byConversation = new Map();
  for (const row of rows ?? []) {
    byConversation.set(row.conversation_id, row.partner_id);
  }
  return byConversation;
}

function buildUserHeadline(ownerDisplayName, petName, userId = "") {
  const owner = String(ownerDisplayName ?? "").trim();
  const pet = String(petName ?? "").trim();
  if (owner || pet) return formatProfileHeadline(owner, pet);
  const shortId = String(userId ?? "").slice(0, 6);
  return shortId ? `User ${shortId}` : "User";
}

export async function loadMessagesPageData(userId, { targetUserId = "", conversationId = "" } = {}) {
  const supabase = await getSupabaseServerClient();

  let forcedConversationId = null;
  const trimmedTarget = String(targetUserId ?? "").trim();
  if (trimmedTarget && isUuid(trimmedTarget) && trimmedTarget !== userId) {
    const { data: conversationId } = await supabase.rpc("get_or_create_direct_conversation", {
      p_target_user: trimmedTarget,
    });
    forcedConversationId = conversationId ?? null;
  }

  const { data: partnerRows } = await supabase.rpc("list_direct_conversation_partners");
  const conversationIds = [...new Set((partnerRows ?? []).map((r) => r.conversation_id).filter(Boolean))];
  if (!conversationIds.length) {
    return {
      conversations: [],
      activeConversationId: null,
      initialMessages: [],
    };
  }

  const partnerByConversation = buildPartnerMap(partnerRows ?? []);
  const partnerIds = [...new Set((partnerRows ?? []).map((r) => r.partner_id).filter(Boolean))];

  const { data: partnerProfiles } = partnerIds.length
    ? await supabase.rpc("public_profiles_for_users", { p_user_ids: partnerIds })
    : { data: [] };

  const profileByOwner = Object.fromEntries(
    (partnerProfiles ?? []).map((p) => [
      p.owner_id,
      {
        headline: buildUserHeadline(p.owner_display_name, p.pet_name, p.owner_id),
        avatarUrl: p.profile_image_url ?? "",
      },
    ]),
  );

  const { data: messageRows } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,media_url,media_kind,created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true })
    .limit(800);

  const messagesByConversation = new Map();
  for (const row of messageRows ?? []) {
    const list = messagesByConversation.get(row.conversation_id) ?? [];
    list.push({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      body: row.body,
      mediaUrl: row.media_url ?? "",
      mediaKind: row.media_kind ?? null,
      createdAt: row.created_at,
    });
    messagesByConversation.set(row.conversation_id, list);
  }

  const conversations = conversationIds
    .map((conversationId) => {
      const partnerId = partnerByConversation.get(conversationId) ?? null;
      const profile = partnerId ? profileByOwner[partnerId] : null;
      const messages = messagesByConversation.get(conversationId) ?? [];
      const latest = messages[messages.length - 1] ?? null;
      const latestPreview =
        latest?.body?.trim() ||
        (latest?.mediaKind === "video"
          ? "Sent a video"
          : latest?.mediaKind === "image"
            ? "Sent an image"
            : "");
      return {
        id: conversationId,
        partnerId,
        partnerHeadline: profile?.headline ?? buildUserHeadline("", "", partnerId),
        partnerAvatarUrl: profile?.avatarUrl ?? "",
        lastMessage: latestPreview,
        lastMessageAt: latest?.createdAt ?? "",
      };
    })
    .sort((a, b) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt)));

  const requestedConversationId = String(conversationId ?? "").trim();
  const canUseRequestedConversation =
    requestedConversationId && conversations.some((c) => c.id === requestedConversationId);
  const activeConversationId =
    (canUseRequestedConversation ? requestedConversationId : null) ??
    forcedConversationId ??
    conversations[0]?.id ??
    null;
  const initialMessages = activeConversationId
    ? (messagesByConversation.get(activeConversationId) ?? [])
    : [];

  return {
    conversations,
    activeConversationId,
    initialMessages,
  };
}

