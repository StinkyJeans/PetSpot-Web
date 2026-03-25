"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

/** Portal shell (no hooks) so caption state unmounts when the modal closes. */
export default function SharePostModal({
  isOpen,
  onClose,
  onSubmit,
  post,
  submitting = false,
}) {
  if (typeof document === "undefined") return null;
  if (!isOpen || !post) return null;

  return createPortal(
    <SharePostModalContent
      post={post}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
    />,
    document.body,
  );
}

function SharePostModalContent({ post, onClose, onSubmit, submitting }) {
  const [caption, setCaption] = useState("");

  const previewMedia = useMemo(() => post?.media_url || post?.image_url || "", [post]);
  const previewKind = useMemo(() => post?.media_kind || "", [post]);
  const previewCaption = useMemo(() => String(post?.caption ?? "").trim(), [post]);

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit?.(caption);
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Share this post</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
          {previewKind === "video" && previewMedia ? (
            <video src={previewMedia} controls className="max-h-[260px] w-full rounded-xl object-cover" />
          ) : null}
          {(previewKind === "image" || !previewKind) && previewMedia ? (
            <img src={previewMedia} alt="" className="max-h-[260px] w-full rounded-xl object-cover" />
          ) : null}
          {previewCaption ? <p className="mt-2 line-clamp-3 text-xs text-zinc-700">{previewCaption}</p> : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Your caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add your own caption..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
          >
            {submitting ? "Sharing..." : "Share post"}
          </button>
        </form>
      </div>
    </div>
  );

  return modal;
}
