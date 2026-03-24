"use client";

import Link from "next/link";
import { logout } from "@/app/auth/actions";
import EventSection from "@/components/event/event-section";
import { usePathname, useSearchParams } from "next/navigation";
import { Calendar, PhotoCamera, Plus, TrendUp, User, UsersGroup } from "griddy-icons";

const explore = [
  { id: "profile", href: "/profile", label: "Profile", icon: User },
  { id: "trending", href: "/feed", label: "Trending", icon: TrendUp },
  { id: "events", href: "/events/new", label: "Events", icon: Calendar },
  { id: "groups", href: "/community", label: "Groups", icon: UsersGroup },
  { id: "memories", href: "/profile?section=memories", label: "Memories", icon: PhotoCamera },
];

function getActiveByRoute(pathname, section) {
  if (pathname.startsWith("/profile")) return section === "memories" ? "memories" : "profile";
  if (pathname.startsWith("/feed")) return "trending";
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/community")) return "groups";
  return "";
}

export default function FeedLeftSidebar({
  myEvents = [],
  otherEvents = [],
  activeItem,
  showEventSection = true,
  profileName = "Profile",
  profileImageUrl = "",
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "";
  const active = activeItem ?? getActiveByRoute(pathname, section);

  return (
    <div className="space-y-4">
      <div className="mb-3 flex min-h-[65vh] flex-col rounded-3xl p-4 lg:mb-0 lg:h-full lg:min-h-0">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full bg-emerald-50">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-900">
                  {profileName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <p className="line-clamp-2 text-sm font-semibold text-zinc-900">{profileName}</p>
          </div>
          <ul className="mt-4 space-y-1">
            {explore.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.id === active
                        ? "bg-emerald-100/80 text-emerald-950"
                        : "text-zinc-700 hover:bg-emerald-100/40"
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

        <div className="mt-auto pt-6">
          <div className="space-y-2">
            <Link
              href="/feed#create"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
            >
              <Plus size={18} color="#fff" />
              Create
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>

      {showEventSection ? <EventSection myEvents={myEvents} otherEvents={otherEvents} /> : null}
    </div>
  );
}
