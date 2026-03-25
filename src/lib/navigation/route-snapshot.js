/**
 * SessionStorage keys for stale-while-revalidate style loading UIs.
 * New pages: use routeSnapshotStorageKey("/your/path") with RouteSnapshotWriter on the page
 * and read the same key in that segment loading.js.
 */

export const ROUTE_SNAPSHOT_VERSION = "v1";
const PREFIX = `petspot:route:snapshot:${ROUTE_SNAPSHOT_VERSION}:`;

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
