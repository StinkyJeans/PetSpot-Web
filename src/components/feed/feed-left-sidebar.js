"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { logout } from "@/app/auth/actions";
import EventSection from "@/components/event/event-section";
import { getOptimizedImageUrl } from "@/lib/imageUrl";
import { requestRoutePrefetch } from "@/lib/navigation/prefetch";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, PhotoCamera, Plus, TrendUp, User, UsersGroup } from "griddy-icons";

const explore = [
  { id: "profile", href: "/profile", label: "Profile", icon: User },
  { id: "trending", href: "/feed", label: "Trending", icon: TrendUp },
  { id: "events", href: "/events/new", label: "Events", icon: Calendar },
  { id: "groups", href: "/community", label: "Groups", icon: UsersGroup },
  { id: "memories", href: "/profile?section=memories", label: "Memories", icon: PhotoCamera },
];

function LogoutSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}

function getActiveByRoute(pathname, section) {
  if (pathname === "/profile") return section === "memories" ? "memories" : "profile";
  if (pathname.startsWith("/feed")) return "trending";
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/community")) return "groups";
  return "";
}

export default function FeedLeftSidebar({
  myEvents = [],
  otherEvents = [],
  followedEvents = [],
  activeItem,
  showEventSection = true,
  /** When true (e.g. mobile drawer), drop tall min-height so the panel scrolls cleanly. */
  embedded = false,
  profileName = "Profile",
  profileImageUrl = "",
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "";
  const active = activeItem ?? getActiveByRoute(pathname, section);

  return (
    <div
      className={`flex min-h-0 flex-col gap-4 lg:h-full ${
        embedded ? "h-full min-h-0 flex-1" : "flex-1"
      }`}
    >
      <div
        className={`mb-3 flex min-h-0 flex-1 flex-col rounded-3xl p-4 lg:mb-0 ${
          embedded ? "min-h-0 flex-1" : "min-h-[65vh] lg:min-h-0"
        }`}
      >
        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full bg-emerald-50">
              {profileImageUrl ? (
                <img
                  src={getOptimizedImageUrl(profileImageUrl, { width: 88, height: 88 })}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
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
                    onMouseEnter={() => requestRoutePrefetch(router, item.href)}
                    onFocus={() => requestRoutePrefetch(router, item.href)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.id === active
                        ? "bg-emerald-300/85 text-emerald-950 shadow-sm"
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

        <div className="mt-auto shrink-0 pt-6">
          <div className="space-y-2">
            <Link
              href="/feed#create"
              onMouseEnter={() => requestRoutePrefetch(router, "/feed")}
              onFocus={() => requestRoutePrefetch(router, "/feed")}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
            >
              <Plus size={18} color="#fff" />
              Create
            </Link>
            <form action={logout}>
              <LogoutSubmitButton />
            </form>
          </div>
        </div>
      </div>

      {showEventSection ? (
        <EventSection
          myEvents={myEvents}
          otherEvents={otherEvents}
          followedEvents={followedEvents}
        />
      ) : null}
    </div>
  );
}
