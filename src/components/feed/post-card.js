"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  addPostComment,
  getPostComments,
  recordPostShare,
  togglePostLike,
} from "@/app/feed/actions";
import { formatCount } from "@/components/feed/format-count";
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
}) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentError, setCommentError] = useState("");
  const [commentPending, startCommentTransition] = useTransition();
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [sharePending, startShareTransition] = useTransition();

  useEffect(() => {
    setLocalCommentCount(commentCount);
  }, [commentCount]);

  useEffect(() => {
    if (!showComments) return;
    let cancelled = false;
    getPostComments(post.id).then(({ comments: rows }) => {
      if (!cancelled) setComments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [showComments, post.id]);

  const tags = extractTags(post.caption);
  const mediaSrc = post.media_url || post.image_url;
  const petName = post.pet_profiles?.pet_name || "Pet";
  const ownerName = post.pet_profiles?.owner_display_name || "";
  const headline = formatProfileHeadline(ownerName, petName);
  const breed = post.pet_profiles?.breed || "";
  const authorLocation = post.pet_profiles?.location || "";
  const authorAvatar = post.pet_profiles?.profile_image_url || "";

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
      const { comments: rows } = await getPostComments(post.id);
      setComments(rows);
      setLocalCommentCount((n) => n + 1);
      router.refresh();
    });
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/feed?post=${post.id}`
        : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "PetSpot", text: post.caption?.slice(0, 140) ?? "", url });
      } else if (url) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled share sheet */
    }

    const fd = new FormData();
    fd.append("postId", post.id);
    startShareTransition(async () => {
      await recordPostShare(fd);
      router.refresh();
    });
  }

  const captionPlain = post.caption.replace(/#[\w]+/g, "").trim();

  return (
    <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-800">
                {headline.slice(0, 1)}
              </span>
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{headline}</p>
            <p className="text-xs text-zinc-500">
              {[breed, authorLocation].filter(Boolean).join(" · ") || "PetSpot"}
            </p>
          </div>
        </div>
        <button type="button" className="mt-1 text-zinc-400 hover:text-zinc-600" aria-label="More">
          <MenuAlt03 size={20} />
        </button>
      </header>

      {post.media_kind === "video" && mediaSrc ? (
        <div className="px-4">
          <video src={mediaSrc} controls className="max-h-[420px] w-full rounded-2xl object-cover" />
        </div>
      ) : null}
      {(post.media_kind === "image" && mediaSrc) || (!post.media_kind && mediaSrc) ? (
        <div className="px-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100">
            <img src={mediaSrc} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 px-4 py-2">
        <div className="flex items-center gap-4">
          <form action={togglePostLike}>
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-zinc-700 hover:text-emerald-900"
            >
              <Heart size={20} color={liked ? "#ef4444" : "#374151"} filled={liked} />
              <span>{formatCount(likeCount)}</span>
            </button>
          </form>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-zinc-700 hover:text-emerald-900"
          >
            <ChatBubble size={20} color="#374151" />
            <span>{formatCount(localCommentCount)}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharePending}
            className="flex items-center gap-1.5 text-sm text-zinc-700 hover:text-emerald-900 disabled:opacity-50"
            aria-label="Share post"
          >
            <ShareIos size={20} color={shared ? "#059669" : "#374151"} />
            <span>{formatCount(shareCount)}</span>
          </button>
        </div>
        <button type="button" className="text-zinc-400 hover:text-emerald-800" aria-label="Save">
          <Bookmark size={20} />
        </button>
      </div>

      <p className="px-4 pb-2 text-sm leading-relaxed text-zinc-800">
        <span className="font-semibold text-zinc-900">{headline}</span> {captionPlain}
      </p>

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

      <div className="border-t border-zinc-100 px-4 py-3">
        {showComments ? (
          <ul className="mb-3 space-y-2 text-sm">
            {comments.length === 0 ? (
              <li className="text-zinc-500">No comments yet.</li>
            ) : (
              comments.map((c) => (
                <li key={c.id} className="text-zinc-800">
                  <span className="font-semibold text-zinc-900">{c.authorName}</span> {c.body}
                </li>
              ))
            )}
          </ul>
        ) : null}

        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input type="hidden" name="postId" value={post.id} />
          <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">
            {viewerPetAvatarUrl ? (
              <img src={viewerPetAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px]">You</span>
            )}
          </span>
          <input
            name="body"
            placeholder="Add a comment..."
            className="flex-1 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
            disabled={commentPending}
          />
          <button
            type="submit"
            disabled={commentPending}
            className="rounded-full bg-emerald-900 px-3 text-xs font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
          >
            Post
          </button>
        </form>
        {commentError ? <p className="mt-2 text-xs text-red-600">{commentError}</p> : null}
      </div>
    </article>
  );
}
