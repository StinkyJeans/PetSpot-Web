"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatCount } from "@/components/feed/format-count";
import { formatRelativeTimeAgo } from "@/lib/time/live-relative-time";
import { formatProfileHeadline } from "@/lib/profile";
import { ChatBubble, Heart, ShareIos } from "griddy-icons";

function extractTags(text) {
  const m = text.match(/#[\w]+/g);
  return m ? [...new Set(m)] : [];
}

/** @param {Array<{ id: string, parentId?: string | null, createdAt: string, replies?: unknown[] }>} flat */
function buildCommentTree(flat) {
  if (!flat?.length) return [];
  const nodes = new Map();
  for (const c of flat) {
    nodes.set(c.id, { ...c, replies: [] });
  }
  const roots = [];
  for (const c of flat) {
    const node = nodes.get(c.id);
    const pid = c.parentId;
    if (pid && nodes.has(pid)) {
      nodes.get(pid).replies.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const n of nodes.values()) {
    n.replies.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  return roots;
}

function commentDisplayName(c) {
  return c.authorHeadline || c.authorName || "Pet parent";
}

function viewRepliesLabel(count) {
  if (count <= 0) return "";
  if (count === 1) return "View 1 reply";
  return `View all ${count} replies`;
}

/** Thread connector + “View all … replies” / indented thread block (Facebook-style). */
function ReplyThreadChrome({ depth, children }) {
  const indentClass = depth < 4 ? "ml-2 border-l-2 border-emerald-100/80 pl-3" : "ml-1 pl-2";
  return <div className={`mt-3 space-y-3 ${indentClass}`}>{children}</div>;
}

/** L-shaped elbow + label row for collapsed reply count. */
function CollapsedRepliesToggle({ count, onExpand }) {
  return (
    <div className="mt-2 flex gap-2 pl-1">
      <div className="flex w-5 shrink-0 justify-end pt-0.5" aria-hidden>
        <div className="flex flex-col items-end">
          <div className="h-2 w-px bg-zinc-300" />
          <div className="flex items-end">
            <div className="h-4 w-px bg-zinc-300" />
            <div className="h-3 w-4 border-b border-l border-zinc-300 rounded-bl-sm" />
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-expanded="false"
        onClick={onExpand}
        className="pb-0.5 text-left text-[11px] font-semibold text-zinc-500 hover:text-emerald-800"
      >
        {viewRepliesLabel(count)}
      </button>
    </div>
  );
}

function CommentThreadItem({ comment, depth, onReply, onToggleCommentLike, commentLikePending }) {
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const name = commentDisplayName(comment);
  const initial = name.replace(/&/g, "").trim().slice(0, 1).toUpperCase() || "?";
  const replyCount = comment.replies?.length ?? 0;
  const hasReplies = replyCount > 0;

  return (
    <li className="text-sm">
      <div className="flex gap-2">
        <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50">
          {comment.authorAvatarUrl ? (
            <img src={comment.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-emerald-900">
              {initial}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-3 py-2">
            <p className="text-xs font-semibold text-zinc-900">{name}</p>
            <p className="text-sm text-zinc-800">{comment.body}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 pl-1 text-[11px] font-semibold">
            <span className="text-zinc-400">{formatRelativeTimeAgo(comment.createdAt)}</span>
            <button
              type="button"
              disabled={commentLikePending}
              onClick={() => onToggleCommentLike(comment.id)}
              className="flex items-center gap-1 text-zinc-500 hover:text-emerald-800 disabled:opacity-50"
            >
              <Heart size={14} color={comment.liked ? "#ef4444" : "currentColor"} filled={comment.liked} />
              {comment.likeCount > 0 ? <span>{formatCount(comment.likeCount)}</span> : <span>Like</span>}
            </button>
            <button type="button" onClick={() => onReply(comment.id)} className="text-zinc-500 hover:text-emerald-800">
              Reply
            </button>
          </div>
          {hasReplies && !repliesExpanded ? (
            <CollapsedRepliesToggle count={replyCount} onExpand={() => setRepliesExpanded(true)} />
          ) : null}
          {hasReplies && repliesExpanded ? (
            <ReplyThreadChrome depth={depth}>
              <ul className="space-y-3">
                {comment.replies.map((r) => (
                  <CommentThreadItem
                    key={r.id}
                    comment={r}
                    depth={depth + 1}
                    onReply={onReply}
                    onToggleCommentLike={onToggleCommentLike}
                    commentLikePending={commentLikePending}
                  />
                ))}
              </ul>
              <button
                type="button"
                aria-expanded="true"
                onClick={() => setRepliesExpanded(false)}
                className="pl-1 text-left text-[11px] font-semibold text-zinc-500 hover:text-emerald-800"
              >
                Hide replies
              </button>
            </ReplyThreadChrome>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function PostCommentsModal({
  isOpen,
  onClose,
  post,
  headline,
  comments,
  commentError,
  commentPending,
  onCommentSubmit,
  viewerPetAvatarUrl,
  commentAsLabel,
  replyParentId,
  onReplyParentChange,
  onToggleCommentLike,
  commentLikePending,
  likeCount,
  commentCount,
  shareCount,
  liked,
  shared,
}) {
  if (typeof document === "undefined") return null;
  if (!isOpen || !post) return null;

  return createPortal(
    <PostCommentsModalInner
      post={post}
      headline={headline}
      comments={comments}
      commentError={commentError}
      commentPending={commentPending}
      onCommentSubmit={onCommentSubmit}
      viewerPetAvatarUrl={viewerPetAvatarUrl}
      commentAsLabel={commentAsLabel}
      replyParentId={replyParentId}
      onReplyParentChange={onReplyParentChange}
      onToggleCommentLike={onToggleCommentLike}
      commentLikePending={commentLikePending}
      likeCount={likeCount}
      commentCount={commentCount}
      shareCount={shareCount}
      liked={liked}
      shared={shared}
      onClose={onClose}
    />,
    document.body,
  );
}

function PostCommentsModalInner({
  post,
  headline,
  comments,
  commentError,
  commentPending,
  onCommentSubmit,
  viewerPetAvatarUrl,
  commentAsLabel,
  replyParentId,
  onReplyParentChange,
  onToggleCommentLike,
  commentLikePending,
  likeCount,
  commentCount,
  shareCount,
  liked,
  shared,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

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
  const authorAvatar = post.pet_profiles?.profile_image_url || "";
  const breed = post.pet_profiles?.breed || "";
  const authorLocation = post.pet_profiles?.location || "";
  const sharedProfile = Array.isArray(normalizedSharedPost?.pet_profiles)
    ? (normalizedSharedPost.pet_profiles[0] ?? null)
    : (normalizedSharedPost?.pet_profiles ?? null);
  const sharedHeadline = formatProfileHeadline(
    sharedProfile?.owner_display_name || "",
    sharedProfile?.pet_name || "Pet",
  );
  const sharedAvatar = sharedProfile?.profile_image_url || "";
  const sharedBreed = sharedProfile?.breed || "";
  const sharedLocation = sharedProfile?.location || "";

  const tags = extractTags(post.caption);
  const captionPlain = post.caption.replace(/#[\w]+/g, "").trim();

  const title = useMemo(() => {
    const h = (headline || formatProfileHeadline(ownerName, petName)).trim();
    return `${h}'s post`;
  }, [headline, ownerName, petName]);

  const commentRoots = useMemo(() => buildCommentTree(comments), [comments]);

  const replyTargetLabel = useMemo(() => {
    if (!replyParentId) return "";
    const row = comments.find((c) => c.id === replyParentId);
    return row ? commentDisplayName(row) : "";
  }, [comments, replyParentId]);

  function handleStartReply(commentId) {
    onReplyParentChange(commentId);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-comments-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92vh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative shrink-0 border-b border-zinc-200 px-4 py-3 text-center">
          <h2 id="post-comments-modal-title" className="pr-10 text-sm font-bold text-zinc-900 sm:text-base">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close comments"
          >
            <span className="text-lg leading-none" aria-hidden>
              ×
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50">
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
                  {[breed, authorLocation].filter(Boolean).join(" · ") || "PetSpot"}
                </p>
              </div>
            </div>
            {captionPlain ? <p className="mt-3 text-sm leading-relaxed text-zinc-800">{captionPlain}</p> : null}
            {tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900"
                  >
                    {t.replace("#", "")}
                  </span>
                ))}
              </div>
            ) : null}

            {normalizedSharedPost ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/50">
                {sharedMediaKind === "video" && sharedMediaSrc ? (
                  <video src={sharedMediaSrc} controls className="max-h-[220px] w-full bg-zinc-900 object-contain" />
                ) : null}
                {(sharedMediaKind === "image" && sharedMediaSrc) || (!sharedMediaKind && sharedMediaSrc) ? (
                  <img src={sharedMediaSrc} alt="" className="max-h-[220px] w-full object-cover" />
                ) : null}
                <div className="border-t border-zinc-100 bg-white px-3 py-2">
                  <div className="flex gap-2">
                    <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                      {sharedAvatar ? (
                        <img src={sharedAvatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-700">
                          {sharedHeadline.slice(0, 1)}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-zinc-900">{sharedHeadline}</p>
                      <p className="text-zinc-500">{[sharedBreed, sharedLocation].filter(Boolean).join(" · ")}</p>
                      {normalizedSharedPost.caption ? (
                        <p className="mt-1 text-sm text-zinc-800">{normalizedSharedPost.caption}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {!normalizedSharedPost && mediaKind === "video" && mediaSrc ? (
              <div className="mt-3">
                <video src={mediaSrc} controls className="max-h-[240px] w-full rounded-xl object-cover" />
              </div>
            ) : null}
            {!normalizedSharedPost && ((mediaKind === "image" && mediaSrc) || (!mediaKind && mediaSrc)) ? (
              <div className="mt-3 overflow-hidden rounded-xl bg-zinc-100">
                <img src={mediaSrc} alt="" className="max-h-[240px] w-full object-cover" />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <Heart size={16} color={liked ? "#ef4444" : "#9ca3af"} filled={liked} />
              <span>{formatCount(likeCount)}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ChatBubble size={16} color="#9ca3af" />
                {formatCount(commentCount)}
              </span>
              <span className="flex items-center gap-1">
                <ShareIos size={16} color={shared ? "#059669" : "#9ca3af"} />
                {formatCount(shareCount)}
              </span>
            </span>
          </div>

          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Comments</p>
            <ul className="space-y-4 text-sm">
              {commentRoots.length === 0 ? (
                <li className="text-zinc-500">No comments yet. Be the first to comment.</li>
              ) : (
                commentRoots.map((c) => (
                  <CommentThreadItem
                    key={c.id}
                    comment={c}
                    depth={0}
                    onReply={handleStartReply}
                    onToggleCommentLike={onToggleCommentLike}
                    commentLikePending={commentLikePending}
                  />
                ))
              )}
            </ul>
          </div>
        </div>

        <footer className="shrink-0 border-t border-zinc-200 bg-white p-3 sm:p-4">
          {replyParentId ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-emerald-50/80 px-3 py-2 text-xs text-emerald-950">
              <span>
                Replying to <span className="font-semibold">{replyTargetLabel || "comment"}</span>
              </span>
              <button
                type="button"
                onClick={() => onReplyParentChange(null)}
                className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : null}
          <form onSubmit={onCommentSubmit} className="flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="parentCommentId" value={replyParentId ?? ""} />
            <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">
              {viewerPetAvatarUrl ? (
                <img src={viewerPetAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px]">You</span>
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <input
                name="body"
                placeholder={commentAsLabel ? `Comment as ${commentAsLabel}` : "Write a comment..."}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
                disabled={commentPending}
                autoComplete="off"
              />
              {commentError ? <p className="text-xs text-red-600">{commentError}</p> : null}
            </div>
            <button
              type="submit"
              disabled={commentPending}
              className="shrink-0 self-end rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
            >
              {commentPending ? "…" : "Post"}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
