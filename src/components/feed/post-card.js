"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  addPostComment,
  deletePost,
  getPostComments,
  sharePost,
  togglePostCommentLike,
  togglePostLike,
} from "@/app/feed/actions";
import PostCommentsModal from "@/components/modal/post/post-comments-modal";
import SharePostModal from "@/components/modal/post/share-post-modal";
import { useDeleteFeedback } from "@/components/feedback/delete-feedback";
import { useToast } from "@/components/feedback/toast-provider";
import { formatCount } from "@/components/feed/format-count";
import { usePostEngagementRealtime } from "@/lib/feed/use-post-engagement-realtime";
import { useLiveRelativeTime } from "@/lib/time/live-relative-time";
import { formatProfileHeadline } from "@/lib/profile";
import { Bookmark, ChatBubble, Heart, MenuAlt03, ShareIos } from "griddy-icons";

function extractTags(text) {
  const m = text.match(/#[\w]+/g);
  return m ? [...new Set(m)] : [];
}

export default function PostCard({
  post,
  likeCount,
  commentCount,
  shareCount,
  liked,
  shared,
  viewerPetAvatarUrl,
  viewerUserId,
  viewerCommentLabel = "",
}) {
  const router = useRouter();
  const menuRef = useRef(null);
  const engagementRtRef = useRef(null);
  const [engagementRtEnabled, setEngagementRtEnabled] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentReplyParentId, setCommentReplyParentId] = useState(null);
  const commentsModalOpenRef = useRef(false);
  useEffect(() => {
    commentsModalOpenRef.current = commentsModalOpen;
  }, [commentsModalOpen]);
  const [comments, setComments] = useState([]);
  const [commentError, setCommentError] = useState("");
  const [commentPending, startCommentTransition] = useTransition();
  const [commentLikePending, startCommentLikeTransition] = useTransition();
  const [sharePending, startShareTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const { showToast } = useToast();
  const { notifyDeleted, notifyDeleteFailed } = useDeleteFeedback();

  const canDelete =
    Boolean(viewerUserId && post.owner_id && viewerUserId === post.owner_id);

  const onRemoteCommentChange = useCallback(() => {
    if (!commentsModalOpenRef.current) return;
    getPostComments(post.id).then(({ comments: rows }) => {
      setComments(rows);
    });
  }, [post.id]);

  const {
    likeCount: liveLikeCount,
    commentCount: liveCommentCount,
    shareCount: liveShareCount,
    liked: liveLiked,
    shared: liveShared,
  } = usePostEngagementRealtime({
    postId: post.id,
    viewerUserId: viewerUserId ?? null,
    initialLikeCount: likeCount,
    initialCommentCount: commentCount,
    initialShareCount: shareCount,
    initialLiked: liked,
    initialShared: shared,
    onRemoteCommentChange,
    enabled: engagementRtEnabled,
  });

  useEffect(() => {
    if (!commentsModalOpen) return;
    let cancelled = false;
    getPostComments(post.id).then(({ comments: rows }) => {
      if (!cancelled) setComments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [commentsModalOpen, post.id]);

  useEffect(() => {
    if (!postMenuOpen) return;
    function onDocMouseDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setPostMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [postMenuOpen]);

  useEffect(() => {
    const el = engagementRtRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setEngagementRtEnabled(true));
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        setEngagementRtEnabled(entry.isIntersecting);
      },
      { root: null, rootMargin: "280px 0px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tags = extractTags(post.caption);
  const normalizedSharedPost = Array.isArray(post.shared_post)
    ? (post.shared_post[0] ?? null)
    : (post.shared_post ?? null);
  const sourcePost = normalizedSharedPost ?? post;
  const mediaSrc = sourcePost.media_url || sourcePost.image_url;
  const mediaKind = sourcePost.media_kind || "";
  const sharedMediaSrc = normalizedSharedPost
    ? normalizedSharedPost.media_url || normalizedSharedPost.image_url || ""
    : "";
  const sharedMediaKind = normalizedSharedPost?.media_kind || "";
  const petName = post.pet_profiles?.pet_name || "Pet";
  const ownerName = post.pet_profiles?.owner_display_name || "";
  const headline = formatProfileHeadline(ownerName, petName);
  const breed = post.pet_profiles?.breed || "";
  const authorLocation = post.pet_profiles?.location || "";
  const authorAvatar = post.pet_profiles?.profile_image_url || "";
  const sharedProfile = Array.isArray(normalizedSharedPost?.pet_profiles)
    ? (normalizedSharedPost.pet_profiles[0] ?? null)
    : (normalizedSharedPost?.pet_profiles ?? null);
  const sharedPetName = sharedProfile?.pet_name || "Pet";
  const sharedOwnerName = sharedProfile?.owner_display_name || "";
  const sharedHeadline = formatProfileHeadline(sharedOwnerName, sharedPetName);
  const sharedBreed = sharedProfile?.breed || "";
  const sharedLocation = sharedProfile?.location || "";
  const sharedAvatar = sharedProfile?.profile_image_url || "";
  const postTimeLive = useLiveRelativeTime(post.created_at ?? null);
  const originalPostTimeLive = useLiveRelativeTime(normalizedSharedPost?.created_at ?? null);

  async function handleCommentSubmit(e) {
    e.preventDefault();
    setCommentError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    startCommentTransition(async () => {
      const r = await addPostComment(null, fd);
      if (r?.error) {
        setCommentError(r.error);
        return;
      }
      form.reset();
      setCommentReplyParentId(null);
      if (r?.comment) {
        setComments((prev) => [...prev, r.comment]);
      } else {
        const { comments: rows } = await getPostComments(post.id);
        setComments(rows);
      }
    });
  }

  const handleToggleCommentLike = useCallback(
    (commentId) => {
      startCommentLikeTransition(async () => {
        const r = await togglePostCommentLike(commentId);
        if (r?.error) {
          showToast(r.error, "error");
          return;
        }
        if (r?.commentId != null && typeof r.liked === "boolean" && typeof r.likeCount === "number") {
          setComments((prev) =>
            prev.map((c) =>
              c.id === r.commentId ? { ...c, liked: r.liked, likeCount: r.likeCount } : c,
            ),
          );
        } else {
          const { comments: rows } = await getPostComments(post.id);
          setComments(rows);
        }
      });
    },
    [post.id, showToast],
  );

  const captionPlain = post.caption.replace(/#[\w]+/g, "").trim();

  return (
    <article
      id={post?.id ? `post-${post.id}` : undefined}
      ref={engagementRtRef}
      className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm"
    >
      <header className="flex items-start justify-between gap-3 p-4 pb-2">
        <Link
          href={`/profile/${post.owner_id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none ring-emerald-800/30 hover:bg-emerald-50/80 focus-visible:ring-2"
        >
          <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-800">
                {headline.slice(0, 1)}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{headline}</p>
            <p className="text-xs text-zinc-500">
              {[breed, authorLocation, postTimeLive].filter(Boolean).join(" · ") || "PetSpot"}
            </p>
          </div>
        </Link>
        {canDelete ? (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              className="mt-1 text-zinc-400 hover:text-zinc-600"
              aria-label="Post options"
              aria-expanded={postMenuOpen}
              onClick={() => setPostMenuOpen((v) => !v)}
            >
              <MenuAlt03 size={20} />
            </button>
            {postMenuOpen ? (
              <div className="absolute right-0 top-9 z-10 min-w-[140px] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  disabled={deletePending}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  onClick={() => {
                    if (!window.confirm("Delete this post? This cannot be undone.")) return;
                    setPostMenuOpen(false);
                    const fd = new FormData();
                    fd.append("postId", post.id);
                    startDeleteTransition(async () => {
                      const result = await deletePost(fd);
                      if (result?.error) {
                        notifyDeleteFailed(result.error);
                        return;
                      }
                      notifyDeleted();
                      // Defer refresh so the toast can commit and paint (immediate refresh can hide it).
                      window.setTimeout(() => {
                        router.refresh();
                      }, 150);
                    });
                  }}
                >
                  {deletePending ? "Deleting…" : "Delete post"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      {captionPlain ? <p className="mt-3 px-4 pb-2 text-sm leading-relaxed text-zinc-800">{captionPlain}</p> : null}

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-900"
            >
              {t.replace("#", "")}
            </span>
          ))}
        </div>
      ) : null}

      {normalizedSharedPost ? (
        <div className="mx-4 mb-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* Facebook-style: original media first, then original author + caption */}
          {sharedMediaKind === "video" && sharedMediaSrc ? (
            <video
              src={sharedMediaSrc}
              controls
              className="max-h-[min(420px,70vh)] w-full bg-zinc-900 object-contain"
            />
          ) : null}
          {(sharedMediaKind === "image" && sharedMediaSrc) || (!sharedMediaKind && sharedMediaSrc) ? (
            <img
              src={sharedMediaSrc}
              alt=""
              className="max-h-[min(420px,70vh)] w-full bg-zinc-100 object-cover"
            />
          ) : null}
          <div className="border-t border-zinc-100 bg-white px-3 py-2.5">
            <div className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                {sharedAvatar ? (
                  <img src={sharedAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-zinc-800">
                    {sharedHeadline.slice(0, 1)}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{sharedHeadline}</p>
                <div className="flex flex-wrap items-center gap-x-1 text-[11px] text-zinc-500">
                  <span>{[sharedBreed, sharedLocation].filter(Boolean).join(" · ") || "PetSpot"}</span>
                  {originalPostTimeLive ? <span>{`· ${originalPostTimeLive}`}</span> : null}
                </div>
                {normalizedSharedPost.caption ? (
                  <p className="mt-1.5 text-sm leading-snug text-zinc-800">{normalizedSharedPost.caption}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!normalizedSharedPost && mediaKind === "video" && mediaSrc ? (
        <div className="px-4 pb-2">
          <video src={mediaSrc} controls className="max-h-[420px] w-full rounded-2xl object-cover" />
        </div>
      ) : null}
      {!normalizedSharedPost && ((mediaKind === "image" && mediaSrc) || (!mediaKind && mediaSrc)) ? (
        <div className="px-4 pb-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100">
            <img src={mediaSrc} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between border-t border-zinc-100 px-4 py-2">
        <div className="flex items-center gap-4">
          <form action={togglePostLike}>
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-zinc-700 hover:text-emerald-900"
            >
              <Heart size={20} color={liveLiked ? "#ef4444" : "#374151"} filled={liveLiked} />
              <span>{formatCount(liveLikeCount)}</span>
            </button>
          </form>
          <button
            type="button"
            onClick={() => setCommentsModalOpen(true)}
            className="flex items-center gap-1.5 text-sm text-zinc-700 hover:text-emerald-900"
            aria-expanded={commentsModalOpen}
            aria-haspopup="dialog"
          >
            <ChatBubble size={20} color="#374151" />
            <span>{formatCount(liveCommentCount)}</span>
          </button>
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            disabled={sharePending}
            className="flex items-center gap-1.5 text-sm text-zinc-700 hover:text-emerald-900 disabled:opacity-50"
            aria-label="Share post"
          >
            <ShareIos size={20} color={liveShared ? "#059669" : "#374151"} />
            <span>{formatCount(liveShareCount)}</span>
          </button>
        </div>
        <button type="button" className="text-zinc-400 hover:text-emerald-800" aria-label="Save">
          <Bookmark size={20} />
        </button>
      </div>

      <PostCommentsModal
        isOpen={commentsModalOpen}
        onClose={() => {
          setCommentReplyParentId(null);
          setCommentsModalOpen(false);
        }}
        post={post}
        headline={headline}
        comments={comments}
        commentError={commentError}
        commentPending={commentPending}
        onCommentSubmit={handleCommentSubmit}
        viewerPetAvatarUrl={viewerPetAvatarUrl}
        commentAsLabel={viewerCommentLabel}
        replyParentId={commentReplyParentId}
        onReplyParentChange={setCommentReplyParentId}
        onToggleCommentLike={handleToggleCommentLike}
        commentLikePending={commentLikePending}
        likeCount={liveLikeCount}
        commentCount={liveCommentCount}
        shareCount={liveShareCount}
        liked={liveLiked}
        shared={liveShared}
      />

      <SharePostModal
        isOpen={shareModalOpen}
        post={sourcePost}
        submitting={sharePending}
        onClose={() => setShareModalOpen(false)}
        onSubmit={async (shareCaption) => {
          const fd = new FormData();
          fd.append("postId", post.id);
          fd.append("caption", shareCaption || "");
          startShareTransition(async () => {
            const result = await sharePost(null, fd);
            if (result?.error) {
              showToast(result.error, "error");
              return;
            }
            setShareModalOpen(false);
            showToast("Post shared successfully.", "success");
            router.refresh();
          });
        }}
      />
    </article>
  );
}
