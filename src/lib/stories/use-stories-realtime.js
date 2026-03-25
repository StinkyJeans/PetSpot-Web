"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatProfileHeadline } from "@/lib/profile";

function normalizeStoryRow(s) {
  if (!s) return null;
  return {
    id: s.id,
    ownerId: s.owner_id,
    mediaKind: s.media_kind,
    mediaUrl: s.media_url,
    caption: s.caption ?? null,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
  };
}

export function useStoriesRealtime({
  viewerUserId,
  initialStories,
  enabled = true,
}) {
  const [stories, setStories] = useState(initialStories ?? []);

  // Cache author headline/avatar so we don't re-query pet_profiles for every INSERT.
  const authorCacheRef = useRef(new Map());

  useEffect(() => {
    // Defer to avoid ESLint's "setState synchronously within an effect" warning.
    queueMicrotask(() => setStories(initialStories ?? []));
  }, [initialStories]);

  const isActiveStory = useMemo(() => {
    // Single function avoids re-creating Date objects in the hook body.
    return (expiresAt) => {
      if (!expiresAt) return false;
      const dt = new Date(expiresAt);
      return dt.getTime() > Date.now();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`stories:user_stories`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_stories",
        },
        async (payload) => {
          const row = normalizeStoryRow(payload.new);
          if (!row) return;
          if (!isActiveStory(row.expiresAt)) return;

          setStories((prev) => {
            // Update existing story if present; otherwise insert.
            const exists = prev.some((s) => s.id === row.id);
            if (exists) {
              return prev
                .map((s) => (s.id === row.id ? { ...s, ...row, viewerHasViewed: s.viewerHasViewed } : s))
                .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
            }
            return [{ ...row, viewerHasViewed: false }, ...prev].sort((a, b) =>
              String(b.createdAt).localeCompare(String(a.createdAt)),
            );
          });

          // Fill author info asynchronously (no full refetch).
          if (row.ownerId && !authorCacheRef.current.has(row.ownerId)) {
            const { data: pets } = await supabase
              .from("pet_profiles")
              .select("owner_id, pet_name, owner_display_name, profile_image_url")
              .eq("is_primary", true)
              .eq("owner_id", row.ownerId);

            const p = pets?.[0];
            authorCacheRef.current.set(row.ownerId, {
              authorHeadline: formatProfileHeadline(p?.owner_display_name, p?.pet_name),
              authorAvatarUrl: p?.profile_image_url ?? "",
            });
          }

          const cached = authorCacheRef.current.get(row.ownerId);
          if (cached) {
            setStories((prev) =>
              prev.map((s) =>
                s.id === row.id
                  ? {
                      ...s,
                      authorHeadline: cached.authorHeadline || s.authorHeadline,
                      authorAvatarUrl: cached.authorAvatarUrl || s.authorAvatarUrl,
                    }
                  : s,
              ),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_stories",
        },
        (payload) => {
          const deletedId = payload.old?.id;
          if (!deletedId) return;
          setStories((prev) => prev.filter((s) => s.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, isActiveStory]);

  // Keep signature flexible for UI: caller can update viewerHasViewed without refetch.
  return {
    stories,
    setStories,
  };
}

