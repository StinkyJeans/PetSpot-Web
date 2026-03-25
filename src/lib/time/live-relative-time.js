"use client";

import { useLayoutEffect, useState } from "react";

/**
 * @param {string | null | undefined} isoString
 * @param {number} [nowMs]
 */
export function formatRelativeTimeAgo(isoString, nowMs = Date.now()) {
  if (!isoString) return "";
  const then = new Date(isoString).getTime();
  if (!Number.isFinite(then)) return "";
  const diffSec = Math.floor((nowMs - then) / 1000);
  if (diffSec < 0) return "just now";
  if (diffSec < 60) return `${Math.max(1, diffSec)}s`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks <= 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months <= 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

/**
 * Recomputes the label on a schedule that speeds up for newer posts (feels "live").
 */
export function useLiveRelativeTime(isoString) {
  /** `null` until after mount so SSR and the first client pass match (no Date.now() drift). */
  const [now, setNow] = useState(null);

  useLayoutEffect(() => {
    if (!isoString) return undefined;

    let timeoutId;
    let cancelled = false;

    function schedule() {
      if (cancelled) return;
      setNow(Date.now());
      const then = new Date(isoString).getTime();
      if (!Number.isFinite(then)) return;
      const ageSec = (Date.now() - then) / 1000;
      const delay =
        ageSec < 120 ? 10_000 : ageSec < 3600 ? 30_000 : ageSec < 86_400 ? 60_000 : 300_000;
      timeoutId = window.setTimeout(schedule, delay);
    }

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isoString]);

  if (!isoString) return "";
  if (now === null) return "";
  return formatRelativeTimeAgo(isoString, now);
}
