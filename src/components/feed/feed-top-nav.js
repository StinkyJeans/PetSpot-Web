import Link from "next/link";
import { Plus, Search } from "griddy-icons";
import { logout } from "@/app/auth/actions";

const navInactive = "border-b-2 border-transparent pb-0.5 text-sm font-medium text-zinc-600 hover:text-emerald-900";
const navActive =
  "border-b-2 border-emerald-800 pb-0.5 text-sm font-semibold text-emerald-900";

export default function FeedTopNav({ active = "feed" }) {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-[#F1F8F1]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/feed" className="text-xl font-bold tracking-tight text-emerald-950">
          PetSpot
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
          <Link href="/feed" className={active === "feed" ? navActive : navInactive}>
            Feed
          </Link>
          <Link href="/market" className={active === "market" ? navActive : navInactive}>
            Market
          </Link>
          <Link href="/adopt" className={active === "adopt" ? navActive : navInactive}>
            Adopt
          </Link>
          <Link href="/community" className={active === "community" ? navActive : navInactive}>
            Community
          </Link>
          <Link href="/profile" className={active === "profile" ? navActive : navInactive}>
            Profile
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/feed#create"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
          >
            <Plus size={18} color="#fff" />
            Create
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
