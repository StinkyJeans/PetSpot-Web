"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Dog, Home, Search, ShoppingBag, UsersGroup } from "griddy-icons";
import FeedNotificationsDropdown from "@/components/feed/feed-notifications-dropdown";
import FeedMessagesDropdown from "@/components/feed/feed-messages-dropdown";
import { useFeedMobileSidebar } from "@/components/feed/feed-mobile-sidebar-context";
import { useMessagesMobileSidebar } from "@/components/messages/messages-mobile-sidebar-context";
import GlobalSearch from "@/components/search/global-search";
import { requestRoutePrefetch } from "@/lib/navigation/prefetch";

const iconNavInactive =
  "inline-flex items-center justify-center rounded-xl p-2 text-zinc-600 transition-colors hover:bg-emerald-200/90 hover:text-emerald-950";
const iconNavActive =
  "inline-flex items-center justify-center rounded-xl bg-emerald-300/85 p-2 text-emerald-950";

function getActiveNav(pathname) {
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/market")) return "market";
  if (pathname.startsWith("/adopt")) return "adopt";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/search")) return "search";
  return "feed";
}

function HamburgerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FeedTopNav({ active, searchInitialQuery = "", mobileMessagesLayout = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const feedMobileSidebar = useFeedMobileSidebar();
  const messagesMobileSidebar = useMessagesMobileSidebar();
  const mobileSidebar = mobileMessagesLayout ? messagesMobileSidebar : feedMobileSidebar;
  const current = active ?? getActiveNav(pathname);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (!mobileSearchOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSearchOpen]);

  function prefetch(href) {
    requestRoutePrefetch(router, href);
  }

  const primaryLinks = (
    <>
      <Link
        href="/feed"
        className={current === "feed" ? iconNavActive : iconNavInactive}
        onMouseEnter={() => prefetch("/feed")}
        title="Feed"
        aria-label="Feed"
      >
        <Home size={22} color="currentColor" aria-hidden />
      </Link>
      <Link
        href="/market"
        className={current === "market" ? iconNavActive : iconNavInactive}
        onMouseEnter={() => prefetch("/market")}
        title="Market"
        aria-label="Market"
      >
        <ShoppingBag size={22} color="currentColor" aria-hidden />
      </Link>
      <Link
        href="/adopt"
        className={current === "adopt" ? iconNavActive : iconNavInactive}
        onMouseEnter={() => prefetch("/adopt")}
        title="Adopt"
        aria-label="Adopt"
      >
        <Dog size={22} color="currentColor" aria-hidden />
      </Link>
      <Link
        href="/community"
        className={current === "community" ? iconNavActive : iconNavInactive}
        onMouseEnter={() => prefetch("/community")}
        title="Community"
        aria-label="Community"
      >
        <UsersGroup size={22} color="currentColor" aria-hidden />
      </Link>
    </>
  );

  return (
    <header className="relative z-30 border-b border-emerald-100/80 bg-[#F1F8F1]/95 backdrop-blur md:sticky md:top-0">
      {/* Mobile */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-1">
            {mobileSidebar ? (
              <button
                type="button"
                className={`inline-flex shrink-0 items-center justify-center rounded-xl p-2 text-zinc-700 transition-colors hover:bg-emerald-200/90 hover:text-emerald-950`}
                aria-label="Open menu"
                aria-expanded={mobileSidebar.open}
                aria-controls={mobileMessagesLayout ? "messages-mobile-sidebar" : "feed-mobile-sidebar"}
                onClick={() => mobileSidebar.toggle()}
              >
                <HamburgerIcon />
              </button>
            ) : (
              <span className="w-10 shrink-0" aria-hidden />
            )}
            <Link
              href="/feed"
              className="min-w-0 shrink-0 leading-tight"
              onMouseEnter={() => prefetch("/feed")}
            >
              <span className="block text-lg font-bold tracking-tight text-emerald-950">PetSpot</span>
            </Link>
            {mobileMessagesLayout ? (
              <Link
                href="/feed"
                className={`${current === "feed" ? iconNavActive : iconNavInactive} shrink-0`}
                onMouseEnter={() => prefetch("/feed")}
                title="Feed"
                aria-label="Feed"
              >
                <Home size={22} color="currentColor" aria-hidden />
              </Link>
            ) : null}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-xl p-2 text-zinc-700 transition-colors hover:bg-emerald-200/90 hover:text-emerald-950"
              aria-label="Open search"
              aria-expanded={mobileSearchOpen}
              aria-controls="feed-mobile-search-modal"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search size={22} color="currentColor" aria-hidden />
            </button>
            <FeedNotificationsDropdown />
            <FeedMessagesDropdown
              isActive={current === "messages"}
              navActive={iconNavActive}
              navInactive={iconNavInactive}
              onPrefetch={() => prefetch("/messages")}
            />
          </div>
        </div>
        {mobileSearchOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                id="feed-mobile-search-modal"
                className="fixed inset-0 z-[100] touch-manipulation md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Search"
              >
                <button
                  type="button"
                  className="absolute inset-0 cursor-default bg-zinc-900/40"
                  aria-label="Close search"
                  onClick={() => setMobileSearchOpen(false)}
                />
                <div
                  className="relative z-10 mx-auto flex max-h-[min(92dvh,720px)] w-full max-w-7xl flex-col rounded-b-3xl border-b border-emerald-100 bg-[#F1F8F1] px-4 pb-4 pt-3 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-emerald-950">Search</span>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-zinc-600 hover:bg-emerald-100"
                      onClick={() => setMobileSearchOpen(false)}
                      aria-label="Close search"
                    >
                      ×
                    </button>
                  </div>
                  <GlobalSearch
                    variant="modal"
                    initialQuery={searchInitialQuery}
                    onRequestClose={() => setMobileSearchOpen(false)}
                  />
                </div>
              </div>,
              document.body,
            )
          : null}
        {mobileMessagesLayout ? null : (
          <nav
            className="flex w-full items-center justify-center gap-4 sm:gap-6"
            aria-label="Primary"
          >
            {primaryLinks}
          </nav>
        )}
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-7xl flex-wrap items-center gap-y-3 px-4 py-3 md:flex md:flex-nowrap md:gap-x-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <Link
            href="/feed"
            className="shrink-0 leading-tight"
            onMouseEnter={() => prefetch("/feed")}
          >
            <span className="block text-xl font-bold tracking-tight text-emerald-950">PetSpot</span>
            <span className="block text-[11px] font-medium text-emerald-800/90">Discover the pack</span>
          </Link>

          <div className="flex min-w-0 max-w-[200px] flex-1 sm:max-w-[240px] md:max-w-[260px] md:flex-initial">
            <GlobalSearch initialQuery={searchInitialQuery} />
          </div>
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-6 md:flex"
          aria-label="Primary"
        >
          {primaryLinks}
        </nav>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-4 md:flex lg:gap-6">
          <FeedNotificationsDropdown />
          <FeedMessagesDropdown
            isActive={current === "messages"}
            navActive={iconNavActive}
            navInactive={iconNavInactive}
            onPrefetch={() => prefetch("/messages")}
          />
        </div>
      </div>
    </header>
  );
}
