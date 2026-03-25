"use client";

import { useEffect } from "react";
import { routeSnapshotStorageKey } from "@/lib/navigation/route-snapshot";

/**
 * Persists a JSON snapshot for `loading.js` to read (sessionStorage).
 * @param {string} routeKey — pathname without host, e.g. "/profile"
 * @param {object | null | undefined} snapshot — JSON-serializable
 */
export default function RouteSnapshotWriter({ routeKey, snapshot }) {
  useEffect(() => {
    if (snapshot == null) return;
    try {
      sessionStorage.setItem(routeSnapshotStorageKey(routeKey), JSON.stringify(snapshot));
    } catch {
      // Ignore storage write errors.
    }
  }, [routeKey, snapshot]);

  return null;
}
