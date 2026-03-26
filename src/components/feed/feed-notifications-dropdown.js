"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/app/notifications/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function labelForType(type, isFollowBack = false, eventTitle = "", eventWhen = "", eventPlace = "") {
  switch (type) {
    case "follow":
      return isFollowBack ? "followed you back" : "just followed you. Follow back?";
    case "event_interested":
      return `followed your ${eventTitle} (${eventWhen}, ${eventPlace})`;
    case "post_like":
      return "liked your post";
    case "post_comment":
      return "commented on your post";
    case "comment_reply":
      return "replied to your comment";
    case "comment_like":
      return "liked your comment";
    default:
      return "interacted with your activity";
  }
}

function timeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
}

export default function FeedNotificationsDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchNotifications({ limit: 40 });
      queueMicrotask(() => setItems(rows));
    } catch {
      queueMicrotask(() => setItems([]));
    } finally {
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      queueMicrotask(() => setUserId(data.session?.user?.id ?? null));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      queueMicrotask(() => setUserId(session?.user?.id ?? null));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    load();
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = items.filter((i) => !i.readAt).length;

  function toggleOpen() {
    setOpen((v) => !v);
  }

  async function onMarkAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    router.refresh();
  }

  if (!userId) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200/80 bg-white text-emerald-900 shadow-sm hover:bg-emerald-50"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-emerald-100 bg-white py-2 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 pb-2">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            {items.some((i) => !i.readAt) ? (
              <button
                type="button"
                onClick={() => onMarkAll()}
                className="text-xs font-medium text-emerald-800 hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-[min(70vh,420px)] overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-zinc-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-zinc-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={
                        n.type === "follow" && n.actorId
                          ? `/profile/${n.actorId}`
                          : n.type === "event_interested"
                            ? "/feed#event-followed"
                            : n.postId
                              ? `/feed#post-${n.postId}`
                              : "/feed"
                      }
                      className="flex gap-3 px-3 py-2.5 hover:bg-emerald-50/80"
                      onClick={async () => {
                        setOpen(false);
                        if (!n.readAt) {
                          await markNotificationsRead([n.id]);
                          setItems((prev) =>
                            prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)),
                          );
                          router.refresh();
                        }
                      }}
                    >
                      <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-100">
                        {n.actorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.actorAvatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-900">
                            {n.actorHeadline.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-800">
                          <span className="font-semibold">{n.actorHeadline}</span>{" "}
                          <span className="font-normal text-zinc-600">
                            {labelForType(n.type, n.isFollowBack, n.eventTitle, n.eventWhen, n.eventPlace)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-400">{timeLabel(n.createdAt)}</p>
                      </div>
                      {!n.readAt ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
