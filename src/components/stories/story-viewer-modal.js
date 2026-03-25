"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { recordStoryView } from "@/app/stories/actions";
import { useToast } from "@/components/feedback/toast-provider";
import { ChatBubble, Heart, ShareIos } from "griddy-icons";

export default function StoryViewerModal({
  stories,
  startIndex,
  onClose,
  onMarkSeen,
}) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const lastRecordedRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(startIndex ?? 0);
  const [progressPct, setProgressPct] = useState(0);
  const [durationMs, setDurationMs] = useState(5000);
  const [durationReady, setDurationReady] = useState(false);
  const videoRef = useRef(null);

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

  useEffect(() => {
    if (!currentStory?.id) return;
    if (lastRecordedRef.current === currentStory.id) return;
    lastRecordedRef.current = currentStory.id;

    startTransition(async () => {
      const r = await recordStoryView(currentStory.id);
      if (r?.error) {
        showToast(r.error, "error");
        return;
      }
      onMarkSeen?.(currentStory.id);
    });
  }, [currentStory?.id, onMarkSeen, startTransition, showToast]);

  const IMAGE_DURATION_MS = 5000;
  const MAX_VIDEO_DURATION_MS = 30000;

  useEffect(() => {
    // Reset progress whenever story changes.
    queueMicrotask(() => {
      setProgressPct(0);
      setDurationReady(false);

      if (!currentStory) return;

      if (currentStory.mediaKind === "video") {
        // Wait for video metadata to compute real duration, then clamp.
        setDurationMs(IMAGE_DURATION_MS);
      } else {
        setDurationMs(IMAGE_DURATION_MS);
        setDurationReady(true);
      }
    });
  }, [currentStory?.id, currentStory?.mediaKind]);

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
          onClose();
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
      onClose();
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  function goPrev() {
    if (!stories?.length) return;
    if (currentIndex <= 0) {
      onClose();
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
      setDurationReady(true);
      return;
    }
    setDurationMs(Math.min(MAX_VIDEO_DURATION_MS, Math.floor(dur * 1000)));
    setDurationReady(true);
  };

  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-2 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-black shadow-2xl"
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
            onClick={onClose}
            disabled={pending}
            aria-label="Close story"
          >
            ×
          </button>
        </div>

        {/* Tap zones */}
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

        <div className="flex items-center justify-center bg-black">
          {currentStory.mediaKind === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="max-h-[75vh] w-full object-contain"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={onVideoLoadedMetadata}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt=""
              className="max-h-[75vh] w-full object-contain"
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

