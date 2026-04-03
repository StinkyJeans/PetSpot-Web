"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_SNAPSHOT,
  getRecentSearchesSnapshot,
  subscribeRecentSearches,
} from "@/lib/search/recent-searches";

export function useRecentSearches() {
  return useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearchesSnapshot,
    () => EMPTY_SNAPSHOT,
  );
}
