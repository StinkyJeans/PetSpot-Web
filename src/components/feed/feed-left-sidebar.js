"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Calendar, Hospital, PhotoCamera, TrendUp, UsersGroup } from "griddy-icons";

const explore = [
  { id: "trending", href: "/feed?section=trending", label: "Trending", icon: TrendUp },
  { id: "pet-care", href: "/feed?section=pet-care", label: "Pet Care", icon: Hospital },
  { id: "events", href: "/events/new", label: "Events", icon: Calendar },
  { id: "groups", href: "/community", label: "Groups", icon: UsersGroup },
  { id: "memories", href: "/profile?section=memories", label: "Memories", icon: PhotoCamera },
];

function getActiveByRoute(pathname, section) {
  if (pathname.startsWith("/feed")) return section === "trending" ? "trending" : "pet-care";
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/community")) return "groups";
  if (pathname.startsWith("/profile")) return section === "memories" ? "memories" : "";
  return "";
}

export default function FeedLeftSidebar({ hasEvent = false, activeItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "";
  const active = activeItem ?? getActiveByRoute(pathname, section);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Explore</p>
        <p className="mt-0.5 text-xs text-emerald-800/80">Discover the pack</p>
        <ul className="mt-3 space-y-1">
          {explore.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    item.id === active
                      ? "bg-emerald-100/80 text-emerald-950"
                      : "text-zinc-700 hover:bg-white/80"
                  }`}
                >
                  <Icon size={20} color="currentColor" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {hasEvent ? (
        <div className="rounded-3xl border border-amber-100 bg-[#f5f0e6] p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Join the Golden Hour Meetup</p>
          <p className="mt-1 text-xs text-zinc-600">Central Park • Today 5PM</p>
          <button type="button" className="mt-3 text-sm font-semibold text-emerald-800 underline">
            RSVP Now
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-600">
            no meet up events happening, create a event?
          </p>
          <Link
            href="/events/new"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
          >
            Create event
          </Link>
        </div>
      )}
    </div>
  );
}
