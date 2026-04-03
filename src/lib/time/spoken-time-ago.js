/**
 * Spoken-style relative time (e.g. "3 minutes ago") for UI messages.
 * Safe to import from server or client (no React).
 * @param {string | null | undefined} isoString
 * @param {number} [nowMs]
 */
export function formatSpokenTimeAgo(isoString, nowMs = Date.now()) {
  if (!isoString) return "";
  const then = new Date(isoString).getTime();
  if (!Number.isFinite(then)) return "";
  const diffSec = Math.floor((nowMs - then) / 1000);
  if (diffSec < 0) return "just now";
  if (diffSec < 60) {
    const s = Math.max(1, diffSec);
    return s === 1 ? "1 second ago" : `${s} seconds ago`;
  }
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) {
    return mins === 1 ? "1 minute ago" : `${mins} minutes ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
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
