"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMessageNotifications,
  markAllMessageNotificationsRead,
  markNotificationsRead,
} from "@/app/notifications/actions";
import { ChatBubble } from "griddy-icons";
import { getOptimizedImageUrl } from "@/lib/imageUrl";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function timeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
}

export default function FeedMessagesDropdown({ navActive, navInactive, isActive, onPrefetch }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchMessageNotifications({ limit: 40 });
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
      .channel(`message-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
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

  const unreadPeopleCount = useMemo(() => {
    const unread = items.filter((i) => !i.readAt);
    return new Set(unread.map((i) => i.actorId).filter(Boolean)).size;
  }, [items]);

  function toggleOpen() {
    setOpen((v) => !v);
  }

  async function onMarkAll() {
    await markAllMessageNotificationsRead();
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (!i.readAt ? { ...i, readAt: now } : i)));
    router.refresh();
  }

  if (!userId) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggleOpen}
        onMouseEnter={onPrefetch}
        title="Messages"
        className={`relative inline-flex ${isActive ? navActive : navInactive}`}
        aria-label={unreadPeopleCount > 0 ? `Messages, ${unreadPeopleCount} people with unread messages` : "Messages"}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <ChatBubble size={22} color="currentColor" aria-hidden />
        {unreadPeopleCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadPeopleCount > 99 ? "99+" : unreadPeopleCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-emerald-100 bg-white py-2 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 pb-2">
            <p className="text-sm font-semibold text-zinc-900">Messages</p>
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
          <div className="max-h-[min(70vh,420px)] overflow-y-auto hide-scrollbar">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-zinc-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-zinc-500">No message notifications yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={
                        n.conversationId ? `/messages?conversation=${n.conversationId}` : "/messages"
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
                          <img
                            src={getOptimizedImageUrl(n.actorAvatarUrl, { width: 80, height: 80 })}
                            alt=""
                            width={40}
                            height={40}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-900">
                            {n.actorHeadline.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-800">
                          <span className="font-semibold">{n.actorHeadline}</span>{" "}
                          <span className="font-normal text-zinc-600">sent you a message</span>
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
          <div className="border-t border-zinc-100 px-3 py-2.5">
            <Link
              href="/messages"
              className="text-xs font-semibold text-emerald-800 hover:underline"
              onClick={() => setOpen(false)}
            >
              Open Messages
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
