"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "griddy-icons";

const navInactive = "border-b-2 border-transparent pb-0.5 text-sm font-medium text-zinc-600 hover:text-emerald-900";
const navActive =
  "border-b-2 border-emerald-800 pb-0.5 text-sm font-semibold text-emerald-900";

function getActiveNav(pathname) {
  if (pathname.startsWith("/market")) return "market";
  if (pathname.startsWith("/adopt")) return "adopt";
  if (pathname.startsWith("/community")) return "community";
  return "feed";
}

export default function FeedTopNav({ active }) {
  const pathname = usePathname();
  const current = active ?? getActiveNav(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-[#F1F8F1]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/feed" className="leading-tight">
          <span className="block text-xl font-bold tracking-tight text-emerald-950">PetSpot</span>
          <span className="block text-[11px] font-medium text-emerald-800/90">Discover the pack</span>
        </Link>

        <div className="order-3 flex w-full min-w-[200px] max-w-xl flex-1 items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 shadow-sm md:order-none md:w-auto">
          <Search size={18} color="#6b7280" />
          <input
            type="search"
            placeholder="Search the pack..."
            className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            readOnly
            aria-label="Search (coming soon)"
          />
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/feed" className={current === "feed" ? navActive : navInactive}>
            Feed
          </Link>
          <Link href="/market" className={current === "market" ? navActive : navInactive}>
            Market
          </Link>
          <Link href="/adopt" className={current === "adopt" ? navActive : navInactive}>
            Adopt
          </Link>
          <Link href="/community" className={current === "community" ? navActive : navInactive}>
            Community
          </Link>
        </nav>
      </div>
    </header>
  );
}
