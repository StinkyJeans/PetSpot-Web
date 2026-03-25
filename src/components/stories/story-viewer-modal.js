"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast-provider";
import { ChatBubble, Heart, ShareIos } from "griddy-icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StoryViewerModal({
  stories,
  startIndex,
  onClose,
  onMarkSeen,
  viewerUserId,
}) {
  const { showToast } = useToast();
  const lastRecordedRef = useRef(null);
  const seenStoryIdsRef = useRef(new Set());
  const [currentIndex, setCurrentIndex] = useState(startIndex ?? 0);
  const [progressPct, setProgressPct] = useState(0);
  const [durationMs, setDurationMs] = useState(5000);
  const [durationReady, setDurationReady] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const videoRef = useRef(null);

  function flushSeenToParent() {
    const ids = Array.from(seenStoryIdsRef.current);
    if (!ids.length) return;
    onMarkSeen?.(ids);
    seenStoryIdsRef.current.clear();
  }

  function handleClose() {
    flushSeenToParent();
    onClose();
  }

  useEffect(() => {
    // Defer to avoid ESLint cascading-render warning.
    queueMicrotask(() => {
      setCurrentIndex(() => {
        const max = (stories?.length ?? 1) - 1;
        if (Number.isNaN(startIndex) || startIndex == null) return 0;
        return Math.max(0, Math.min(max, startIndex));
      });
    });
  }, [startIndex, stories?.length]);

  const currentStory = useMemo(() => {
    if (!stories?.length) return null;
    const idx = Math.max(0, Math.min(stories.length - 1, currentIndex));
    return stories[idx] ?? null;
  }, [stories, currentIndex]);

  const currentStoryId = currentStory?.id;
  const uploadComplete = currentStory?.uploadComplete ?? true;

  useEffect(() => {
    if (!currentStory?.id) return;
    if (!viewerUserId) return;
    if (currentStory.uploadComplete === false) return; // don’t count “views” until upload is complete
    if (lastRecordedRef.current === currentStory.id) return;
    lastRecordedRef.current = currentStory.id;

    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("story_views").insert({
        story_id: currentStory.id,
        viewer_user_id: viewerUserId,
      });

      // Duplicate views are fine: unique PK handles it.
      if (error && error.code !== "23505") {
        showToast(error.message || "Could not record story view.", "error");
        return;
      }

      seenStoryIdsRef.current.add(currentStory.id);
    })();
  }, [currentStory?.id, currentStory?.uploadComplete, viewerUserId, showToast]);

  const IMAGE_DURATION_MS = 5000;
  const MAX_VIDEO_DURATION_MS = 30000;

  useEffect(() => {
    // Reset progress whenever story changes.
    queueMicrotask(() => {
      setProgressPct(0);
      setMediaLoaded(false);
      setDurationReady(false);

      if (!currentStory) return;

      // Keep default duration until media tells us otherwise.
      setDurationMs(IMAGE_DURATION_MS);
    });
  }, [currentStory?.id, currentStory?.mediaKind]);

  useEffect(() => {
    // Only start progressing once BOTH:
    // 1) the media has loaded enough to compute/play
    // 2) the upload is marked complete
    queueMicrotask(() => {
      if (!mediaLoaded) {
        setDurationReady(false);
        return;
      }
      if (uploadComplete === false) {
        setDurationReady(false);
        return;
      }
      setDurationReady(true);
    });
  }, [mediaLoaded, uploadComplete]);

  useEffect(() => {
    if (!currentStory || !durationReady) return;

    let raf = 0;
    const startTs = performance.now();

    const tick = (t) => {
      const elapsed = t - startTs;
      const pct = Math.min(100, (elapsed / Math.max(1, durationMs)) * 100);
      setProgressPct(pct);

      if (elapsed >= durationMs) {
        if (!stories?.length) return;
        if (currentIndex >= stories.length - 1) {
          handleClose();
          return;
        }
        setCurrentIndex((i) => i + 1);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentStoryId, durationReady, durationMs]);

  function goNext() {
    if (!stories?.length) return;
    if (currentIndex >= stories.length - 1) {
      handleClose();
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  function goPrev() {
    if (!stories?.length) return;
    if (currentIndex <= 0) {
      handleClose();
      return;
    }
    setCurrentIndex((i) => i - 1);
  }

  const onVideoLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = Number(v.duration);
    if (!Number.isFinite(dur) || dur <= 0) {
      setDurationMs(IMAGE_DURATION_MS);
      setMediaLoaded(true);
      return;
    }
    setDurationMs(Math.min(MAX_VIDEO_DURATION_MS, Math.floor(dur * 1000)));
    setMediaLoaded(true);
  };

  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-2 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg h-[90vh] overflow-hidden rounded-3xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute left-3 right-3 top-3 z-10 flex gap-1.5">
          {(stories ?? []).map((s, idx) => {
            let w = "0%";
            if (idx < currentIndex) w = "100%";
            if (idx === currentIndex) w = `${progressPct}%`;
            return (
              <div key={s.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-0 bg-white" style={{ width: w }} />
              </div>
            );
          })}
        </div>

        {/* Top bar */}
        <div className="absolute left-3 right-3 top-8 z-10 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-black/30">
              {currentStory.authorAvatarUrl ? (
                <img
                  src={currentStory.authorAvatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-white">
                  {String(currentStory.authorHeadline ?? "?").slice(0, 1)}
                </span>
              )}
            </span>
            <span className="min-w-0 truncate text-sm font-semibold text-white">
              {currentStory.authorHeadline}
            </span>
          </div>

          <button
            type="button"
            className="rounded-full bg-black/30 px-3 py-1 text-sm font-semibold text-white hover:bg-black/40"
            onClick={handleClose}
            aria-label="Close story"
          >
            ×
          </button>
        </div>

        {/* Tap zones */}
        <button
          type="button"
          className="absolute left-3 top-1/2 z-[20] -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          aria-label="Previous story"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          ‹
        </button>
        <button
          type="button"
          className="absolute right-3 top-1/2 z-[20] -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          aria-label="Next story"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          ›
        </button>
        <button
          type="button"
          className="absolute left-0 top-0 bottom-0 w-1/2 bg-transparent z-10"
          aria-label="Previous story"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        />
        <button
          type="button"
          className="absolute right-0 top-0 bottom-0 w-1/2 bg-transparent z-10"
          aria-label="Next story"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        />

        <div className="relative flex h-full items-center justify-center bg-black">
          {uploadComplete === false ? (
            <div className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center">
              <div className="w-2/3 rounded-full bg-white/10 p-1">
                <div className="h-1.5 w-1/3 animate-pulse rounded-full bg-white/70" />
              </div>
            </div>
          ) : null}
          {currentStory.mediaKind === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className={`h-full w-full object-contain transition-all duration-200 ${
                uploadComplete === false ? "blur-sm scale-105" : ""
              }`}
              autoPlay={uploadComplete}
              playsInline
              muted
              onLoadedMetadata={onVideoLoadedMetadata}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt=""
              className={`h-full w-full object-contain transition-all duration-200 ${
                uploadComplete === false ? "blur-sm scale-105" : ""
              }`}
              onLoad={() => {
                setDurationMs(IMAGE_DURATION_MS);
                setMediaLoaded(true);
              }}
            />
          )}
        </div>

        {/* Bottom reply bar (UI-only to match Instagram-like viewer) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="pointer-events-none flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/30">
              {currentStory.authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentStory.authorAvatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-white/90">
                  {String(currentStory.authorHeadline ?? "?").slice(0, 1)}
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-left text-xs font-semibold text-white/70">
              Replying to {currentStory.authorHeadline}
            </div>

            <div className="flex items-center gap-3">
              <div className="pointer-events-none flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Heart size={16} color="#f43f5e" filled />
              </div>
              <div className="pointer-events-none flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <ChatBubble size={16} color="#e5e7eb" />
              </div>
              <div className="pointer-events-none flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <ShareIos size={16} color="#e5e7eb" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

