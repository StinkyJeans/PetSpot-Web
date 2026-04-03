"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dog, Home, ShoppingBag, UsersGroup } from "griddy-icons";
import FeedNotificationsDropdown from "@/components/feed/feed-notifications-dropdown";
import FeedMessagesDropdown from "@/components/feed/feed-messages-dropdown";
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

export default function FeedTopNav({ active, searchInitialQuery = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = active ?? getActiveNav(pathname);

  function prefetch(href) {
    requestRoutePrefetch(router, href);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-[#F1F8F1]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-y-3 px-4 py-3 md:flex-nowrap md:gap-x-4">
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
        </nav>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-4 md:flex lg:gap-6">
          <FeedNotificationsDropdown />
          <FeedMessagesDropdown
            isActive={current === "messages"}
            navActive={iconNavActive}
            navInactive={iconNavInactive}
            onPrefetch={() => prefetch("/messages")}
          />
          <Link
            href="/community"
            className={current === "community" ? iconNavActive : iconNavInactive}
            onMouseEnter={() => prefetch("/community")}
            title="Community"
            aria-label="Community"
          >
            <UsersGroup size={22} color="currentColor" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
