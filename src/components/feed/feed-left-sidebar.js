"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/auth/actions";
import { createEvent, updateEvent } from "@/app/events/actions";
import EventModal from "@/components/modal/event/eventModal";
import ViewAllEvent from "@/components/modal/event/viewAllEvent";
import { useToast } from "@/components/feedback/toast-provider";
import { usePathname, useSearchParams } from "next/navigation";
import { Calendar, Hospital, PhotoCamera, Plus, TrendUp, User, UsersGroup } from "griddy-icons";

const explore = [
  { id: "profile", href: "/profile", label: "Profile", icon: User },
  { id: "trending", href: "/feed?section=trending", label: "Trending", icon: TrendUp },
  { id: "pet-care", href: "/feed?section=pet-care", label: "Pet Care", icon: Hospital },
  { id: "events", href: "/events/new", label: "Events", icon: Calendar },
  { id: "groups", href: "/community", label: "Groups", icon: UsersGroup },
  { id: "memories", href: "/profile?section=memories", label: "Memories", icon: PhotoCamera },
];

function getActiveByRoute(pathname, section) {
  if (pathname.startsWith("/profile")) return section === "memories" ? "memories" : "profile";
  if (pathname.startsWith("/feed")) return section === "trending" ? "trending" : "pet-care";
  if (pathname.startsWith("/events")) return "events";
  if (pathname.startsWith("/community")) return "groups";
  return "";
}

function EventCard({ item, showAuthor = false, onEdit }) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="text-[11px] font-semibold text-emerald-800 hover:underline"
          >
            Edit
          </button>
        ) : null}
      </div>
      {showAuthor ? <p className="mt-0.5 text-xs font-medium text-zinc-600">{item.authorName}</p> : null}
      <p className="mt-1 text-xs text-zinc-600">{item.when}</p>
      <p className="mt-0.5 text-xs text-zinc-600">{item.location}</p>
      {item.purpose ? <p className="mt-1 text-xs text-zinc-700 line-clamp-2">{item.purpose}</p> : null}
    </article>
  );
}

export default function FeedLeftSidebar({ myEvents = [], otherEvents = [], activeItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [myEventsState, setMyEventsState] = useState(myEvents);
  const [myEventsPage, setMyEventsPage] = useState(0);
  const { showToast } = useToast();
  const section = searchParams.get("section") ?? "";
  const active = activeItem ?? getActiveByRoute(pathname, section);
  const hasAnyEvent = myEventsState.length > 0 || otherEvents.length > 0;
  const perPage = 2;
  const maxPage = Math.max(0, Math.ceil(myEventsState.length / perPage) - 1);
  const start = myEventsPage * perPage;
  const pagedMyEvents = myEventsState.slice(start, start + perPage);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
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

        <div className="mt-10 border-t border-emerald-100 pt-4">
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

      <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-zinc-900">Event section</h3>
          <button
            type="button"
            onClick={() => setIsEventModalOpen(true)}
            className="rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-950"
          >
            Create your own event
          </button>
        </div>

        {!hasAnyEvent ? (
          <p className="mt-3 text-sm text-zinc-600">No events yet. Create your own event.</p>
        ) : (
          <div className="mt-3 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Your events</p>
                {myEventsState.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIsViewAllOpen(true)}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    Show all
                  </button>
                ) : null}
              </div>
              <div className="mt-2 space-y-2">
                {myEventsState.length ? (
                  pagedMyEvents.map((item) => (
                    <EventCard
                      key={item.id ?? item.when}
                      item={item}
                      onEdit={(selected) => {
                        setEditingEvent(selected);
                        setIsEventModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">You have no events yet.</p>
                )}
              </div>
              {myEventsState.length > perPage ? (
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={myEventsPage <= 0}
                    onClick={() => setMyEventsPage((p) => Math.max(0, p - 1))}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <p className="text-[11px] text-zinc-500">
                    Page {myEventsPage + 1} of {maxPage + 1}
                  </p>
                  <button
                    type="button"
                    disabled={myEventsPage >= maxPage}
                    onClick={() => setMyEventsPage((p) => Math.min(maxPage, p + 1))}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Other people&apos;s events
              </p>
              <div className="mt-2 space-y-2">
                {otherEvents.length ? (
                  otherEvents.map((item) => (
                    <EventCard key={item.id ?? `${item.authorName}-${item.when}`} item={item} showAuthor />
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No events from other users yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <EventModal
        isOpen={isEventModalOpen}
        title={editingEvent ? "Edit event" : "Create event"}
        submitLabel={editingEvent ? "Save changes" : "Create event"}
        initialData={editingEvent}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={async (payload) => {
          const result = editingEvent
            ? await updateEvent({ ...payload, id: editingEvent.id })
            : await createEvent(payload);
          if (result?.error) {
            return result;
          }
          if (result?.event) {
            setMyEventsState((prev) => {
              if (editingEvent) {
                return prev.map((e) => (e.id === editingEvent.id ? { ...e, ...result.event } : e));
              }
              return [result.event, ...prev];
            });
            setMyEventsPage(0);
          }
          showToast(editingEvent ? "Event updated successfully." : "Event created successfully.", "success");
          setEditingEvent(null);
          return result;
        }}
      />
      <ViewAllEvent
        isOpen={isViewAllOpen}
        onClose={() => setIsViewAllOpen(false)}
        events={myEventsState}
        onEdit={(selected) => {
          setIsViewAllOpen(false);
          setEditingEvent(selected);
          setIsEventModalOpen(true);
        }}
      />
    </div>
  );
}
