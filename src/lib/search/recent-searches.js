const STORAGE_KEY = "petspot_recent_searches_v1";
const MAX_ITEMS = 10;
const MAX_LEN = 80;

/** Stable empty list for `useSyncExternalStore` (getSnapshot must not return a new reference each time). */
export const EMPTY_SNAPSHOT = Object.freeze([]);

let listeners = new Set();
let storageHandlerAttached = false;

let snapshotCache = EMPTY_SNAPSHOT;
let snapshotKey = "[]";

function notify() {
  listeners.forEach((fn) => fn());
}

function onStorage(e) {
  if (e.key === STORAGE_KEY) notify();
}

function ensureStorageListener() {
  if (typeof window === "undefined" || storageHandlerAttached) return;
  window.addEventListener("storage", onStorage);
  storageHandlerAttached = true;
}

/**
 * @returns {string[]}
 */
function readList() {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SNAPSHOT;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_SNAPSHOT;
    const list = parsed
      .filter((x) => typeof x === "string")
      .map((s) => s.trim().slice(0, MAX_LEN))
      .filter((s) => s.length >= 2);
    return list.length === 0 ? EMPTY_SNAPSHOT : list;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function writeList(list) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Quota or private mode — ignore.
  }
}

export function subscribeRecentSearches(onStoreChange) {
  ensureStorageListener();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/** For useSyncExternalStore on the client — returns a cached reference when contents are unchanged. */
export function getRecentSearchesSnapshot() {
  const list = readList();
  const key = JSON.stringify(list);
  if (key === snapshotKey) return snapshotCache;
  snapshotKey = key;
  snapshotCache = list;
  return snapshotCache;
}

/**
 * @param {string} raw
 */
export function addRecentSearch(raw) {
  if (typeof window === "undefined") return;
  const q = typeof raw === "string" ? raw.trim().slice(0, MAX_LEN) : "";
  if (q.length < 2) return;
  const lower = q.toLowerCase();
  const prev = readList();
  const filtered = prev.filter((s) => s.toLowerCase() !== lower);
  const next = [q, ...filtered].slice(0, MAX_ITEMS);
  writeList(next);
  notify();
}

/**
 * @param {string} raw
 */
export function removeRecentSearch(raw) {
  if (typeof window === "undefined") return;
  const target = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!target) return;
  const prev = readList();
  const next = prev.filter((s) => s.toLowerCase() !== target);
  writeList(next);
  notify();
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  writeList([]);
  notify();
}
