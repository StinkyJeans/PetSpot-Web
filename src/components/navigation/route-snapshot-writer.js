"use client";

import { useEffect } from "react";
import { routeSnapshotStorageKey, withSnapshotMetadata } from "@/lib/navigation/route-snapshot";

/**
 * Persists a JSON snapshot for `loading.js` to read (sessionStorage).
 * @param {string} routeKey — pathname without host, e.g. "/profile"
 * @param {object | null | undefined} snapshot — JSON-serializable
 */
export default function RouteSnapshotWriter({ routeKey, snapshot }) {
  useEffect(() => {
    if (snapshot == null) return;
    try {
      const payload = withSnapshotMetadata(snapshot);
      if (!payload) return;
      sessionStorage.setItem(routeSnapshotStorageKey(routeKey), JSON.stringify(payload));
    } catch {
      // Ignore storage write errors.
    }
  }, [routeKey, snapshot]);

  return null;
}
