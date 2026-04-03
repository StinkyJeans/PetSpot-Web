"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { compressMediaForUpload } from "@/lib/media/compress-upload-media";
import { buildUserMediaPath } from "@/lib/storage/helpers";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLiveRelativeTime } from "@/lib/time/live-relative-time";
import { getOptimizedImageUrl } from "@/lib/imageUrl";
import { InfoCircle, Phone, Plus, Send, VideoCamera } from "griddy-icons";

const MAX_VIDEO_UPLOAD_BYTES = 15 * 1024 * 1024;

function sortConversations(rows) {
  return [...rows].sort((a, b) => String(b.lastMessageAt ?? "").localeCompare(String(a.lastMessageAt ?? "")));
}

function mapMessageRows(rows) {
  return (rows ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    mediaUrl: row.media_url ?? "",
    mediaKind: row.media_kind ?? null,
    createdAt: row.created_at,
    uploadState: "sent",
  }));
}

function mergeServerMessagesWithUploading(localMessages, serverMessages) {
  const uploading = (localMessages ?? []).filter((m) => m.uploadState === "uploading");
  if (!uploading.length) return serverMessages;
  const serverIds = new Set((serverMessages ?? []).map((m) => m.id));
  const stillUploading = uploading.filter((m) => !serverIds.has(m.id));
  return [...(serverMessages ?? []), ...stillUploading].sort((a, b) =>
    String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")),
  );
}

function extractSharedMediaFromMessages(rows) {
  const media = [];
  for (const row of rows ?? []) {
    const mediaUrl = String(row?.mediaUrl ?? "").trim();
    const mediaKind = row?.mediaKind === "video" ? "video" : row?.mediaKind === "image" ? "image" : null;
    if (mediaUrl && mediaKind) media.push({ url: mediaUrl, kind: mediaKind });
  }
  const unique = [];
  const seen = new Set();
  for (const item of media) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    unique.push(item);
    if (unique.length >= 9) break;
  }
  return unique;
}

function RelativeTime({ iso }) {
  const label = useLiveRelativeTime(iso ?? null);
  return label ? label : "";
}

export default function MessagesPageClient({
  viewerUserId,
  initialConversations = [],
  initialConversationId = null,
  initialMessages = [],
}) {
  const [activeTab, setActiveTab] = useState("followed");
  const [conversations, setConversations] = useState(() => sortConversations(initialConversations));
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [composerError, setComposerError] = useState("");
  const [sending, setSending] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [followerOptions, setFollowerOptions] = useState([]);
  const [followerLoading, setFollowerLoading] = useState(false);
  const [startingConversationFor, setStartingConversationFor] = useState("");
  const [viewerMedia, setViewerMedia] = useState(null);
  const bottomRef = useRef(null);
  const mediaInputRef = useRef(null);

  const tabbedConversations = useMemo(() => {
    if (activeTab === "followed") return conversations;
    return [];
  }, [activeTab, conversations]);

  const activeConversation = useMemo(
    () => tabbedConversations.find((c) => c.id === activeConversationId) ?? null,
    [tabbedConversations, activeConversationId],
  );
  const sharedMediaUrls = useMemo(() => extractSharedMediaFromMessages(messages), [messages]);

  useEffect(() => {
    if (!tabbedConversations.length) {
      setActiveConversationId(null);
      setMessages([]);
      return;
    }
    if (!tabbedConversations.some((c) => c.id === activeConversationId)) {
      setActiveConversationId(tabbedConversations[0].id);
    }
  }, [tabbedConversations, activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeConversationId]);

  useEffect(() => {
    if (!viewerMedia) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setViewerMedia(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewerMedia]);

  useEffect(() => {
    if (!composerError) return undefined;
    const timer = window.setTimeout(() => {
      setComposerError("");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [composerError]);

  useEffect(() => {
    if (!activeConversationId) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    supabase
      .from("messages")
      .select("id,conversation_id,sender_id,body,media_url,media_kind,created_at")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        const serverMapped = mapMessageRows(data).reverse();
        setMessages((prev) => mergeServerMessagesWithUploading(prev, serverMapped));
      });
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    const supabase = getSupabaseBrowserClient();
    const timer = window.setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("id,conversation_id,sender_id,body,media_url,media_kind,created_at")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!data) return;
      const serverMapped = mapMessageRows(data).reverse();
      setMessages((prev) => mergeServerMessagesWithUploading(prev, serverMapped));
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!conversations.length) return undefined;
    const conversationIdSet = new Set(conversations.map((c) => c.id));
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:${viewerUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new;
          if (!row || !conversationIdSet.has(row.conversation_id)) return;
          const nextMessage = {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            body: row.body,
            mediaUrl: row.media_url ?? "",
            mediaKind: row.media_kind ?? null,
            createdAt: row.created_at,
            uploadState: "sent",
          };

          if (row.conversation_id === activeConversationId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === nextMessage.id)) return prev;
              const next = [...prev, nextMessage];
              return next.length > 200 ? next.slice(next.length - 200) : next;
            });
          }

          const realtimePreview =
            String(row.body ?? "").trim() ||
            (row.media_kind === "video" ? "Sent a video" : row.media_kind === "image" ? "Sent an image" : "");
          setConversations((prev) =>
            sortConversations(
              prev.map((c) =>
                c.id === row.conversation_id
                  ? { ...c, lastMessage: realtimePreview, lastMessageAt: row.created_at }
                  : c,
              ),
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewerUserId, conversations, activeConversationId]);

  useEffect(() => {
    if (!newMessageOpen) return;
    let cancelled = false;
    setFollowerLoading(true);
    const supabase = getSupabaseBrowserClient();
    (async () => {
      const { data: rows } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("followee_id", viewerUserId)
        .limit(120);
      const followerIds = [...new Set((rows ?? []).map((r) => r.follower_id).filter(Boolean))];
      if (!followerIds.length) {
        if (!cancelled) {
          setFollowerOptions([]);
          setFollowerLoading(false);
        }
        return;
      }
      const { data: profiles } = await supabase
        .from("pet_profiles")
        .select("owner_id, owner_display_name, pet_name, profile_image_url")
        .eq("is_primary", true)
        .in("owner_id", followerIds);

      const mapped = (profiles ?? []).map((p) => ({
        userId: p.owner_id,
        headline: [p.owner_display_name, p.pet_name].filter(Boolean).join(" & ") || "PetSpot user",
        avatarUrl: p.profile_image_url ?? "",
      }));

      if (!cancelled) {
        setFollowerOptions(mapped);
        setFollowerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [newMessageOpen, viewerUserId]);

  async function sendCurrentMessage(e) {
    e.preventDefault();
    const body = draft.trim();
    const sendingMediaFile = selectedMediaFile;
    if ((!body && !sendingMediaFile) || !activeConversationId || sending) return;
    setComposerError("");
    setDraft("");
    setSelectedMediaFile(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
    setSending(true);
    let tempPreviewUrl = "";
    try {
      const supabase = getSupabaseBrowserClient();
      let mediaUrl = "";
      let mediaKind = null;
      let tempId = null;
      const optimisticCreatedAt = new Date().toISOString();

      if (sendingMediaFile) {
        const rawType = String(sendingMediaFile.type ?? "").toLowerCase();
        mediaKind = rawType.startsWith("video/") ? "video" : rawType.startsWith("image/") ? "image" : null;
        if (!mediaKind) return;
        if (mediaKind === "video" && sendingMediaFile.size > MAX_VIDEO_UPLOAD_BYTES) {
          setComposerError("video size exceeds 15mb");
          return;
        }

        tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        tempPreviewUrl = URL.createObjectURL(sendingMediaFile);
        const optimisticMessage = {
          id: tempId,
          conversationId: activeConversationId,
          senderId: viewerUserId,
          body,
          mediaUrl: tempPreviewUrl,
          mediaKind,
          createdAt: optimisticCreatedAt,
          uploadState: "uploading",
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        const optimisticPreview =
          String(body ?? "").trim() || (mediaKind === "video" ? "Sending video..." : "Sending image...");
        setConversations((prev) =>
          sortConversations(
            prev.map((c) =>
              c.id === activeConversationId
                ? {
                    ...c,
                    lastMessage: optimisticPreview,
                    lastMessageAt: optimisticCreatedAt,
                  }
                : c,
            ),
          ),
        );

        const compressed = await compressMediaForUpload(sendingMediaFile);
        const uploadFile = compressed.file;
        if (!uploadFile) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          if (tempPreviewUrl) URL.revokeObjectURL(tempPreviewUrl);
          return;
        }
        mediaKind = compressed.kind ?? mediaKind;
        if (mediaKind === "video" && uploadFile.size > MAX_VIDEO_UPLOAD_BYTES) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setComposerError("video size exceeds 15mb");
          if (tempPreviewUrl) URL.revokeObjectURL(tempPreviewUrl);
          return;
        }

        const mediaPath = buildUserMediaPath(viewerUserId, "messages", uploadFile.name || "upload.bin");
        const { error: uploadError } = await supabase.storage.from("media-post").upload(mediaPath, uploadFile, {
          upsert: false,
          contentType: uploadFile.type || undefined,
        });
        if (uploadError) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          if (tempPreviewUrl) URL.revokeObjectURL(tempPreviewUrl);
          return;
        }
        const { data: publicData } = supabase.storage.from("media-post").getPublicUrl(mediaPath);
        mediaUrl = String(publicData?.publicUrl ?? "").trim();

        if (mediaUrl) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    mediaUrl,
                  }
                : m,
            ),
          );
        }
      }

      const { data: inserted, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversationId,
          sender_id: viewerUserId,
          body,
          media_url: mediaUrl || null,
          media_kind: mediaKind,
        })
        .select("id, conversation_id, sender_id, body, media_url, media_kind, created_at")
        .single();
      if (!error) {
        if (inserted?.id && inserted?.conversation_id) {
          const preview =
            String(inserted.body ?? "").trim() ||
            (inserted.media_kind === "video" ? "Sent a video" : inserted.media_kind === "image" ? "Sent an image" : "");
          const localMessage = {
            id: inserted.id,
            conversationId: inserted.conversation_id,
            senderId: inserted.sender_id ?? viewerUserId,
            body: inserted.body ?? body,
            mediaUrl: inserted.media_url ?? mediaUrl,
            mediaKind: inserted.media_kind ?? mediaKind,
            createdAt: inserted.created_at ?? new Date().toISOString(),
            uploadState: "sent",
          };
          setMessages((prev) => {
            const uploadPlaceholderIndex = tempId ? prev.findIndex((m) => m.id === tempId) : -1;
            if (uploadPlaceholderIndex >= 0) {
              const next = [...prev];
              next[uploadPlaceholderIndex] = localMessage;
              return next;
            }
            return prev.some((m) => m.id === localMessage.id) ? prev : [...prev, localMessage];
          });
          setConversations((prev) =>
            sortConversations(
              prev.map((c) =>
                c.id === inserted.conversation_id
                  ? {
                      ...c,
                      lastMessage: preview,
                      lastMessageAt: localMessage.createdAt,
                    }
                  : c,
              ),
            ),
          );

          await supabase.rpc("notify_message_sent", {
            p_conversation_id: inserted.conversation_id,
            p_message_id: inserted.id,
          });
        }
      }
      if (error) {
        if (tempId) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
      }
    } finally {
      if (tempPreviewUrl) URL.revokeObjectURL(tempPreviewUrl);
      setSending(false);
    }
  }

  async function startConversationWith(userId) {
    if (!userId || startingConversationFor) return;
    setStartingConversationFor(userId);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: conversationId } = await supabase.rpc("get_or_create_direct_conversation", {
        p_target_user: userId,
      });
      if (!conversationId) return;

      const selectedFollower = followerOptions.find((f) => f.userId === userId);
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversationId)) return prev;
        return sortConversations([
          {
            id: conversationId,
            partnerId: userId,
            partnerHeadline: selectedFollower?.headline ?? "PetSpot user",
            partnerAvatarUrl: selectedFollower?.avatarUrl ?? "",
            lastMessage: "",
            lastMessageAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      });
      setActiveConversationId(conversationId);
      setMessages([]);
      setNewMessageOpen(false);
    } finally {
      setStartingConversationFor("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-3 py-4">
      <div className="grid h-[76vh] grid-cols-1 gap-3 lg:grid-cols-[300px_minmax(620px,1fr)_240px]">
          <aside className="overflow-hidden rounded-2xl bg-[#F1F8F1]">
            <div className="border-b-2 border-emerald-200 px-4 py-4">
              <p className="text-xl font-bold text-emerald-950">Conversations</p>
              <p className="mt-1 text-xs text-zinc-500">Recent chats</p>
              <button
                type="button"
                onClick={() => setNewMessageOpen(true)}
                className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
              >
                <Plus size={15} color="#fff" />
                New Message
              </button>
              <div className="mt-3 flex items-center gap-2">
                {[
                  { id: "followed", label: "FOLLOWED" },
                  { id: "community", label: "COMMUNITY" },
                  { id: "group", label: "GROUP" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
                      activeTab === tab.id
                        ? "bg-emerald-900 text-white"
                        : "bg-white text-emerald-900 hover:bg-emerald-200/90"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[67vh] overflow-y-auto hide-scrollbar">
              {tabbedConversations.length ? (
                tabbedConversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveConversationId(c.id)}
                    className={`flex w-full cursor-pointer items-start gap-3 border-b border-emerald-100/80 px-4 py-3 text-left ${
                      c.id === activeConversationId
                        ? "bg-emerald-300/85"
                        : "hover:bg-emerald-200/85"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-100">
                      {c.partnerAvatarUrl ? (
                        <img src={c.partnerAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="m-auto text-xs font-bold text-emerald-900">
                          {c.partnerHeadline.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">{c.partnerHeadline}</p>
                      <p className="truncate text-xs text-zinc-500">{c.lastMessage || "Say hello!"}</p>
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      <RelativeTime iso={c.lastMessageAt} />
                    </span>
                  </button>
                ))
              ) : activeTab === "followed" ? (
                <p className="px-4 py-8 text-sm text-zinc-500">No conversations yet. Open a profile and click Message.</p>
              ) : (
                <p className="px-4 py-8 text-sm text-zinc-500">
                  No {activeTab === "group" ? "group" : "community"} chats yet.
                </p>
              )}
            </div>
          </aside>

          <section className="flex h-[76vh] max-h-[76vh] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-[#f7faf7] shadow-sm">
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b border-emerald-100 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-emerald-100">
                      {activeConversation.partnerAvatarUrl ? (
                        <img src={activeConversation.partnerAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="m-auto text-[11px] font-bold text-emerald-900">
                          {activeConversation.partnerHeadline.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{activeConversation.partnerHeadline}</p>
                      <p className="text-[10px] text-emerald-700">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="cursor-pointer text-emerald-900 hover:text-emerald-700" aria-label="Video call">
                      <VideoCamera size={16} />
                    </button>
                    <button type="button" className="cursor-pointer text-emerald-900 hover:text-emerald-700" aria-label="Voice call">
                      <Phone size={16} />
                    </button>
                    <button type="button" className="cursor-pointer text-emerald-900 hover:text-emerald-700" aria-label="Conversation info">
                      <InfoCircle size={16} />
                    </button>
                  </div>
                </div>

                <div className="hide-scrollbar flex-1 overflow-y-auto px-5 py-4">
                  {messages.length ? (
                    <div className="space-y-3">
                      <div className="mx-auto mb-1 w-fit rounded-full bg-zinc-200 px-3 py-1 text-[10px] font-semibold text-zinc-600">
                        TODAY
                      </div>
                      {messages.map((m) => {
                        const mine = m.senderId === viewerUserId;
                        const hasMedia = Boolean(m.mediaUrl && m.mediaKind);
                        const isUploading = m.uploadState === "uploading";
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[72%]">
                              {hasMedia ? (
                                <div
                                  className={`overflow-hidden rounded-2xl ${
                                    mine ? "rounded-tr-md bg-emerald-900/10" : "rounded-tl-md bg-emerald-200/60"
                                  }`}
                                >
                                  {m.mediaKind === "video" ? (
                                    <button
                                      type="button"
                                      onClick={() => setViewerMedia({ url: m.mediaUrl, kind: "video" })}
                                      className="relative block w-full cursor-pointer"
                                      disabled={isUploading}
                                    >
                                      <video src={m.mediaUrl} controls preload="metadata" className="max-h-72 w-full object-cover" />
                                      {isUploading ? (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                          <span className="w-[68%]">
                                            <span className="mb-2 block text-center text-xs font-semibold text-white">
                                              Uploading...
                                            </span>
                                            <span className="block h-2 overflow-hidden rounded-full bg-white/25">
                                              <span className="block h-full w-1/2 animate-pulse rounded-full bg-white" />
                                            </span>
                                          </span>
                                        </span>
                                      ) : null}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setViewerMedia({ url: m.mediaUrl, kind: "image" })}
                                      className="relative block w-full cursor-pointer"
                                      disabled={isUploading}
                                    >
                                      <img
                                        src={getOptimizedImageUrl(m.mediaUrl, { width: 720, height: 720 })}
                                        alt=""
                                        loading="lazy"
                                        width={720}
                                        height={720}
                                        className="max-h-72 w-full object-cover"
                                      />
                                      {isUploading ? (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                          <span className="w-[68%]">
                                            <span className="mb-2 block text-center text-xs font-semibold text-white">
                                              Uploading...
                                            </span>
                                            <span className="block h-2 overflow-hidden rounded-full bg-white/25">
                                              <span className="block h-full w-1/2 animate-pulse rounded-full bg-white" />
                                            </span>
                                          </span>
                                        </span>
                                      ) : null}
                                    </button>
                                  )}
                                </div>
                              ) : null}
                              {m.body ? (
                                <div
                                  className={`rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${
                                    mine
                                      ? "rounded-tr-md bg-emerald-800 text-white"
                                      : "rounded-tl-md bg-emerald-200/80 text-zinc-800"
                                  } ${hasMedia ? "mt-1.5" : ""}`}
                                >
                                  {m.body}
                                </div>
                              ) : null}
                              <p className="mt-1 px-1 text-[10px] text-zinc-400">
                                <RelativeTime iso={m.createdAt} />
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">No messages yet. Start the conversation.</p>
                  )}
                </div>

                <form onSubmit={sendCurrentMessage} className="border-t border-emerald-100 bg-white px-4 py-3">
                  {selectedMediaFile ? (
                    <div className="mb-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="truncate text-xs font-medium text-emerald-900">{selectedMediaFile.name}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMediaFile(null);
                          if (mediaInputRef.current) mediaInputRef.current.value = "";
                        }}
                        className="cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      className="cursor-pointer rounded-full p-2 text-emerald-900 hover:bg-emerald-200/80"
                      aria-label="Attach"
                    >
                      <Plus size={14} />
                    </button>
                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) {
                          setSelectedMediaFile(null);
                          return;
                        }
                        const type = String(file.type ?? "").toLowerCase();
                        const isVideo = type.startsWith("video/");
                        if (isVideo && file.size > MAX_VIDEO_UPLOAD_BYTES) {
                          setComposerError("video size exceeds 15mb");
                          setSelectedMediaFile(null);
                          if (mediaInputRef.current) mediaInputRef.current.value = "";
                          return;
                        }
                        setComposerError("");
                        setSelectedMediaFile(file);
                      }}
                    />
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Type a message for ${activeConversation.partnerHeadline.split(" ")[0]}...`}
                      className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={(!draft.trim() && !selectedMediaFile) || sending}
                      className="cursor-pointer rounded-full bg-emerald-900 p-2 text-white hover:bg-emerald-950 disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <Send size={14} color="#fff" />
                    </button>
                  </div>
                  {composerError ? <p className="mt-2 text-xs font-medium text-rose-600">{composerError}</p> : null}
                </form>
              </>
            ) : (
              <div className="m-auto max-w-sm text-center">
                <p className="text-3xl font-bold text-emerald-950">Your Inbox</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Connect with other pet parents and start chatting from your conversation list.
                </p>
              </div>
            )}
          </section>

          <aside className="hidden overflow-hidden rounded-2xl bg-[#F1F8F1] lg:block">
            {activeConversation ? (
              <div className="px-4 py-5">
                <div className="mx-auto flex h-20 w-20 overflow-hidden rounded-full bg-emerald-100">
                  {activeConversation.partnerAvatarUrl ? (
                    <img src={activeConversation.partnerAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="m-auto text-xl font-bold text-emerald-900">
                      {activeConversation.partnerHeadline.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-center text-lg font-bold text-zinc-900">{activeConversation.partnerHeadline}</p>
                <p className="mt-1 text-center text-xs text-zinc-500">PetSpot member</p>

                <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Shared media</p>
                {sharedMediaUrls.length ? (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {sharedMediaUrls.map((item) => (
                      <div
                        key={item.url}
                        className="aspect-square overflow-hidden rounded-xl bg-emerald-100"
                      >
                        {item.kind === "video" ? (
                          <button
                            type="button"
                            onClick={() => setViewerMedia({ url: item.url, kind: "video" })}
                            className="block h-full w-full cursor-pointer"
                          >
                            <video src={item.url} preload="metadata" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewerMedia({ url: item.url, kind: "image" })}
                            className="block h-full w-full cursor-pointer"
                          >
                            <img
                              src={getOptimizedImageUrl(item.url, { width: 320, height: 320 })}
                              alt=""
                              loading="lazy"
                              width={320}
                              height={320}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">
                    No shared media yet, start sending some.
                  </p>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 text-sm text-zinc-500">Select a conversation to view details.</div>
            )}
          </aside>
      </div>

      {newMessageOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setNewMessageOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
              <p className="text-sm font-bold text-zinc-900">New Message</p>
              <button
                type="button"
                onClick={() => setNewMessageOpen(false)}
                className="cursor-pointer text-sm font-semibold text-zinc-500 hover:text-emerald-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-3 py-2">
              {followerLoading ? (
                <p className="px-2 py-6 text-sm text-zinc-500">Loading followers...</p>
              ) : followerOptions.length ? (
                followerOptions.map((f) => (
                  <button
                    key={f.userId}
                    type="button"
                    disabled={startingConversationFor === f.userId}
                    onClick={() => startConversationWith(f.userId)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-emerald-200/75 disabled:opacity-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-100">
                      {f.avatarUrl ? (
                        <img src={f.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="m-auto text-xs font-bold text-emerald-900">
                          {f.headline.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{f.headline}</p>
                      <p className="text-xs text-zinc-500">Follower</p>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-2 py-6 text-sm text-zinc-500">No followers available to message yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {viewerMedia ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-3"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewerMedia(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewerMedia(null)}
              className="absolute right-2 top-2 z-[96] rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white hover:bg-black/80"
            >
              Close
            </button>
            {viewerMedia.kind === "video" ? (
              <video
                src={viewerMedia.url}
                controls
                autoPlay
                preload="metadata"
                className="max-h-[86vh] w-full rounded-xl bg-black object-contain"
              />
            ) : (
              <img
                src={getOptimizedImageUrl(viewerMedia.url, { width: 1920, height: 1920 })}
                alt=""
                className="max-h-[86vh] w-full rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

