const inFlightPrefetches = new Set();
const PREFETCH_CONCURRENCY_LIMIT = 3;

function canUseConnectionHints() {
  if (typeof navigator === "undefined") return false;
  return "connection" in navigator;
}

export function shouldPrefetchNow() {
  if (typeof navigator === "undefined") return false;
  if (!canUseConnectionHints()) return true;
  const connection = navigator.connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  const effectiveType = String(connection.effectiveType ?? "");
  if (effectiveType.includes("2g")) return false;
  return true;
}

export function requestRoutePrefetch(router, href) {
  if (!router || !href) return;
  if (!shouldPrefetchNow()) return;
  if (inFlightPrefetches.has(href)) return;
  if (inFlightPrefetches.size >= PREFETCH_CONCURRENCY_LIMIT) return;
  inFlightPrefetches.add(href);
  try {
    router.prefetch(href);
  } finally {
    window.setTimeout(() => {
      inFlightPrefetches.delete(href);
    }, 1200);
  }
}

