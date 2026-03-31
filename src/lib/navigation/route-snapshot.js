/**
 * SessionStorage keys for stale-while-revalidate style loading UIs.
 * New pages: use routeSnapshotStorageKey("/your/path") with RouteSnapshotWriter on the page
 * and read the same key in that segment loading.js.
 */

export const ROUTE_SNAPSHOT_VERSION = "v1";
const PREFIX = `petspot:route:snapshot:${ROUTE_SNAPSHOT_VERSION}:`;
const TS_KEY = "__savedAt";
export const ROUTE_SNAPSHOT_TTL_MS = 5 * 60 * 1000;

/** @deprecated Use routeSnapshotStorageKey("/feed") — migration from older builds. */
export const LEGACY_FEED_SNAPSHOT_KEY = "petspot:feed:snapshot:v1";

export function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  const base = pathname.split("?")[0] ?? pathname;
  const trimmed = base.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** Storage key for a route segment (pathname only; no query). */
export function routeSnapshotStorageKey(pathname) {
  return `${PREFIX}${normalizePathname(pathname)}`;
}

function isValidObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function withSnapshotMetadata(snapshot) {
  if (!isValidObject(snapshot)) return null;
  return { ...snapshot, [TS_KEY]: Date.now() };
}

export function isSnapshotFresh(snapshot, ttlMs = ROUTE_SNAPSHOT_TTL_MS) {
  if (!isValidObject(snapshot)) return false;
  const savedAt = Number(snapshot[TS_KEY] ?? 0);
  if (!Number.isFinite(savedAt) || savedAt <= 0) return false;
  return Date.now() - savedAt <= ttlMs;
}

export function parseRouteSnapshot(raw, ttlMs = ROUTE_SNAPSHOT_TTL_MS) {
  if (!raw) return null;
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isSnapshotFresh(parsed, ttlMs)) return null;
  return parsed;
}

/**
 * Prefetched on mount from root layout so repeat navigations stay warm.
 * Add new app-shell routes here when you add top-level pages.
 */
export const APP_SHELL_PREFETCH_ROUTES = [
  "/feed",
  "/profile",
  "/community",
  "/market",
  "/adopt",
  "/events/new",
  "/profile?section=memories",
];
