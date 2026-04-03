"use client";

import Link from "next/link";
import { useEffect } from "react";
import { addRecentSearch } from "@/lib/search/recent-searches";
import { useRecentSearches } from "@/lib/search/use-recent-searches";

/**
 * Records a successful search when the user lands on `/search` with a query (e.g. direct URL).
 */
export function SearchRecentRecorder({ query }) {
  useEffect(() => {
    const q = typeof query === "string" ? query.trim() : "";
    if (q.length >= 2) addRecentSearch(q);
  }, [query]);
  return null;
}

/**
 * Full-page list of recent queries (local only); shown when there is no active result query.
 */
export function SearchPageRecentList({ query }) {
  const recent = useRecentSearches();
  const trimmed = typeof query === "string" ? query.trim() : "";
  if (trimmed.length >= 2 || recent.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent searches</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {recent.map((term) => (
          <li key={term}>
            <Link
              href={`/search?q=${encodeURIComponent(term)}`}
              className="inline-flex max-w-full items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm transition hover:bg-emerald-50"
            >
              <span className="truncate">{term}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
