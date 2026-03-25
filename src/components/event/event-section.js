"use client";

import { useState } from "react";
import { createEvent, updateEvent } from "@/app/events/actions";
import EventModal from "@/components/modal/event/eventModal";
import ViewAllEvent from "@/components/modal/event/viewAllEvent";
import { useToast } from "@/components/feedback/toast-provider";

function eventsIdentityKey(events) {
  return (events ?? [])
    .map((e) => e?.id ?? "")
    .join("|");
}

/** Remount when server `myEvents` identity changes so list state stays in sync (no effect sync). */
export default function EventSection(props) {
  return <EventSectionBody key={eventsIdentityKey(props.myEvents)} {...props} />;
}

function EventCard({ item, showAuthor = false, onEdit }) {
  return (
    <article className="px-1 py-3 sm:px-0">
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

function EventSectionBody({ myEvents = [], otherEvents = [], className = "" }) {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [myEventsState, setMyEventsState] = useState(() => [...(myEvents ?? [])]);
  const [myEventsPage, setMyEventsPage] = useState(0);
  const { showToast } = useToast();

  const hasAnyEvent = myEventsState.length > 0 || otherEvents.length > 0;
  const perPage = 2;
  const maxPage = Math.max(0, Math.ceil(myEventsState.length / perPage) - 1);
  const start = myEventsPage * perPage;
  const pagedMyEvents = myEventsState.slice(start, start + perPage);

  return (
    <section className={`rounded-3xl p-4 ${className}`}>
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
        <div className="mt-3">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
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
            <div className="divide-y divide-emerald-200/60">
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
                <p className="py-3 text-xs text-zinc-500">You have no events yet.</p>
              )}
            </div>
            {myEventsState.length > perPage ? (
              <div className="mt-3 flex items-center justify-between border-t border-emerald-200/60 pt-3">
                <button
                  type="button"
                  disabled={myEventsPage <= 0}
                  onClick={() => setMyEventsPage((p) => Math.max(0, p - 1))}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-emerald-100/30 disabled:opacity-50"
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
                  className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-emerald-100/30 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
          <div className="mt-6 border-t border-emerald-200/60 pt-6">
            <p className="border-b border-emerald-200/60 pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Other people&apos;s events
            </p>
            <div className="divide-y divide-emerald-200/60">
              {otherEvents.length ? (
                otherEvents.map((item) => (
                  <EventCard key={item.id ?? `${item.authorName}-${item.when}`} item={item} showAuthor />
                ))
              ) : (
                <p className="py-3 text-xs text-zinc-500">No events from other users yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

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
    </section>
  );
}
