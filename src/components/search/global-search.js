"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search } from "griddy-icons";
import { searchPack } from "@/app/search/actions";
import { getOptimizedImageUrl } from "@/lib/imageUrl";
import {
  addRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
} from "@/lib/search/recent-searches";
import { useRecentSearches } from "@/lib/search/use-recent-searches";
import { requestRoutePrefetch } from "@/lib/navigation/prefetch";

const DEBOUNCE_MS = 280;

function Avatar({ url, label }) {
  const src = url ? getOptimizedImageUrl(url, { width: 80, height: 80, quality: 70 }) : "";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote Supabase URLs; matches feed avatars
      <img
        src={src}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-emerald-100"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100"
      aria-hidden
    >
      {label.slice(0, 1).toUpperCase()}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{children}</p>
  );
}

/**
 * @param {{ initialQuery?: string, variant?: 'inline' | 'modal', onRequestClose?: () => void }} props
 */
export default function GlobalSearch({ initialQuery = "", variant = "inline", onRequestClose }) {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const isModal = variant === "modal";
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(isModal);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ users: [], pages: [], communities: [] });
  const recentAll = useRecentSearches();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!isModal) return undefined;
    const t = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [isModal]);

  useEffect(() => {
    if (!isModal || !onRequestClose) return undefined;
    function onDocKey(e) {
      if (e.key === "Escape") onRequestClose();
    }
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, [isModal, onRequestClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setLoading(false);
      setData({ users: [], pages: [], communities: [] });
      return undefined;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchPack(query);
        setData(res);
      } catch {
        setData({ users: [], pages: [], communities: [] });
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (isModal) return undefined;
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, isModal]);

  const prefetchSearch = useCallback(
    (q) => {
      const s = typeof q === "string" ? q.trim() : "";
      if (s.length < 2) return;
      requestRoutePrefetch(router, `/search?q=${encodeURIComponent(s)}`);
    },
    [router],
  );

  const qTrim = query.trim();
  const totalHits = data.users.length + data.pages.length + data.communities.length;
  const showHintShort = qTrim.length > 0 && qTrim.length < 2;
  const showEmpty = qTrim.length >= 2 && !loading && totalHits === 0;
  const showResultRows = qTrim.length >= 2 && !loading;

  const recentFiltered =
    qTrim.length === 0
      ? recentAll
      : qTrim.length === 1
        ? recentAll.filter((s) => s.toLowerCase().startsWith(qTrim.toLowerCase()))
        : [];
  const showRecent = qTrim.length < 2 && recentFiltered.length > 0;
  const showStartHint = qTrim.length === 0 && recentFiltered.length === 0;

  function closeAndNotify() {
    setOpen(false);
    onRequestClose?.();
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = query.trim();
      if (q.length >= 2) {
        addRecentSearch(q);
        router.push(`/search?q=${encodeURIComponent(q)}`);
        closeAndNotify();
      }
    }
    if (e.key === "Escape") {
      if (isModal && onRequestClose) {
        e.preventDefault();
        onRequestClose();
      } else {
        setOpen(false);
      }
    }
  }

  const showPanel = isModal || open;

  const panelPositionClass = isModal
    ? "relative mt-3 max-h-[min(65vh,520px)] overflow-y-auto rounded-2xl border border-emerald-100 bg-white py-2 shadow-inner"
    : "absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,420px)] overflow-y-auto rounded-2xl border border-emerald-100 bg-white py-2 shadow-xl";

  return (
    <div
      className={`relative min-w-0 ${isModal ? "w-full" : `flex-1 ${open ? "z-30" : ""}`}`}
      ref={rootRef}
      role="search"
    >
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 shadow-sm">
        <Search size={18} color="#6b7280" className="shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search the pack…"
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
          aria-label="Search users, pages, and communities"
          aria-autocomplete="list"
          aria-controls={panelId}
          aria-haspopup="listbox"
          autoComplete="off"
        />
      </div>

      {showPanel ? (
        <div
          id={panelId}
          className={`${panelPositionClass}`}
          role="listbox"
          aria-label="Search suggestions"
        >
          {showRecent ? (
            <div className="border-b border-zinc-100 pb-2">
              <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Recent searches
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-zinc-500 hover:text-emerald-900 hover:underline"
                  onClick={() => clearRecentSearches()}
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-0.5">
                {recentFiltered.map((term) => (
                  <li key={term} className="flex items-center gap-1 pr-1">
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm font-medium text-zinc-900 hover:bg-emerald-50"
                      onClick={() => {
                        addRecentSearch(term);
                        setQuery(term);
                        router.push(`/search?q=${encodeURIComponent(term)}`);
                        closeAndNotify();
                      }}
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      aria-label={`Remove “${term}” from recent searches`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeRecentSearch(term);
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showStartHint ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Start typing to search the pack.</p>
          ) : null}

          {showHintShort ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Type at least 2 characters to search.</p>
          ) : null}

          {query.trim().length >= 2 && loading ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Searching…</p>
          ) : null}

          {showEmpty ? (
            <p className="px-4 py-3 text-sm text-zinc-500">No matches yet. Try another name or keyword.</p>
          ) : null}

          {showResultRows && data.users.length > 0 ? (
            <div className="border-b border-zinc-100 pb-2">
              <SectionTitle>Users</SectionTitle>
              <ul className="space-y-0.5">
                {data.users.map((u) => (
                  <li key={u.ownerId}>
                    <Link
                      href={u.href}
                      className="flex items-center gap-3 px-3 py-2 text-left hover:bg-emerald-50"
                      onClick={closeAndNotify}
                    >
                      <Avatar url={u.avatarUrl} label={u.headline} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">{u.headline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showResultRows && data.pages.length > 0 ? (
            <div className="border-b border-zinc-100 pb-2">
              <SectionTitle>Pages</SectionTitle>
              <ul className="space-y-0.5">
                {data.pages.map((p) => (
                  <li key={`${p.kind}-${p.id}`}>
                    <Link
                      href={p.href}
                      className="flex items-center gap-3 px-3 py-2 text-left hover:bg-emerald-50"
                      onClick={closeAndNotify}
                    >
                      {p.kind === "pet" ? (
                        <Avatar url={p.avatarUrl ?? ""} label={p.title} />
                      ) : (
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900"
                          aria-hidden
                        >
                          Ev
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-zinc-900">{p.title}</span>
                          <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0 text-[10px] font-medium uppercase text-zinc-600">
                            {p.kind === "pet" ? "Pet" : "Event"}
                          </span>
                        </div>
                        {p.subtitle ? <p className="truncate text-xs text-zinc-500">{p.subtitle}</p> : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showResultRows && data.communities.length > 0 ? (
            <div className="pb-2">
              <SectionTitle>Communities</SectionTitle>
              <ul className="space-y-0.5">
                {data.communities.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={c.href}
                      className="flex flex-col gap-0.5 px-3 py-2 text-left hover:bg-emerald-50"
                      onClick={closeAndNotify}
                    >
                      <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                      {c.subtitle ? <span className="text-xs text-zinc-500">{c.subtitle}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showResultRows && totalHits > 0 ? (
            <div className="border-t border-zinc-100 px-3 pt-2">
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                className="block rounded-xl py-2 text-center text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                onClick={() => {
                  addRecentSearch(query.trim());
                  closeAndNotify();
                }}
                onMouseEnter={() => prefetchSearch(query)}
              >
                See all results
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
