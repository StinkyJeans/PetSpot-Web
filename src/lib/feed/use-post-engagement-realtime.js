"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Subscribes to like / comment / share row changes for one post and keeps counts + viewer flags in sync.
 */
export function usePostEngagementRealtime({
  postId,
  viewerUserId,
  initialLikeCount,
  initialCommentCount,
  initialShareCount,
  initialLiked,
  initialShared,
  onRemoteCommentChange,
  /** When false, no Supabase channel is opened (saves connections for off-screen posts). */
  enabled = true,
}) {
  const onRemoteCommentChangeRef = useRef(onRemoteCommentChange);
  useEffect(() => {
    onRemoteCommentChangeRef.current = onRemoteCommentChange;
  }, [onRemoteCommentChange]);

  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [liked, setLiked] = useState(initialLiked);
  const [shared, setShared] = useState(initialShared);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  useEffect(() => {
    setCommentCount(initialCommentCount);
  }, [initialCommentCount]);

  useEffect(() => {
    setShareCount(initialShareCount);
  }, [initialShareCount]);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setShared(initialShared);
  }, [initialShared]);

  useEffect(() => {
    if (!postId || !enabled) return;

    const supabase = getSupabaseBrowserClient();
    const filter = `post_id=eq.${postId}`;

    const channel = supabase
      .channel(`post-engagement:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_likes", filter },
        (payload) => {
          const uid = payload.new?.user_id;
          setLikeCount((c) => c + 1);
          if (viewerUserId && uid === viewerUserId) setLiked(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "post_likes", filter },
        (payload) => {
          const uid = payload.old?.user_id;
          setLikeCount((c) => Math.max(0, c - 1));
          if (viewerUserId && uid === viewerUserId) setLiked(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_comments", filter },
        () => {
          setCommentCount((c) => c + 1);
          onRemoteCommentChangeRef.current?.();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "post_comments", filter },
        () => {
          setCommentCount((c) => Math.max(0, c - 1));
          onRemoteCommentChangeRef.current?.();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_shares", filter },
        (payload) => {
          const uid = payload.new?.user_id;
          setShareCount((c) => c + 1);
          if (viewerUserId && uid === viewerUserId) setShared(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "post_shares", filter },
        (payload) => {
          const uid = payload.old?.user_id;
          setShareCount((c) => Math.max(0, c - 1));
          if (viewerUserId && uid === viewerUserId) setShared(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, viewerUserId, enabled]);

  return { likeCount, commentCount, shareCount, liked, shared };
}
