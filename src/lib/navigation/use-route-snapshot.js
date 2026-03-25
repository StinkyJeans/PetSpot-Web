"use client";

import { useEffect, useState } from "react";
import { LEGACY_FEED_SNAPSHOT_KEY, routeSnapshotStorageKey } from "@/lib/navigation/route-snapshot";

/**
 * @param {string} routeKey — pathname segment, e.g. "/feed" or "/market"
 * @param {{ legacyKey?: string }} [options]
 */
export function useRouteSnapshot(routeKey, options = {}) {
  const { legacyKey } = options;
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    try {
      const key = routeSnapshotStorageKey(routeKey);
      let raw = sessionStorage.getItem(key);
      if (!raw && legacyKey) raw = sessionStorage.getItem(legacyKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      queueMicrotask(() => setSnapshot(parsed));
    } catch {
      // Ignore cache read errors.
    }
  }, [routeKey, legacyKey]);

  return snapshot;
}

/** Feed loading: migrate from legacy key once. */
export function useFeedRouteSnapshot() {
  return useRouteSnapshot("/feed", { legacyKey: LEGACY_FEED_SNAPSHOT_KEY });
}
