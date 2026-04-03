"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import FeedLeftSidebar from "@/components/feed/feed-left-sidebar";

/** Delay before backdrop can close the drawer — avoids the same tap that opened the menu from hitting the overlay (common on mobile). */
const BACKDROP_CLOSE_DELAY_MS = 280;

export default function FeedMobileSidebarDrawer({
  onClose,
  profileName,
  profileImageUrl,
  myEvents,
  otherEvents,
  followedEvents,
}) {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const backdropCloseAllowed = useRef(false);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      backdropCloseAllowed.current = true;
    }, BACKDROP_CLOSE_DELAY_MS);
    return () => {
      window.clearTimeout(id);
      backdropCloseAllowed.current = false;
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      id="feed-mobile-sidebar"
      className="fixed inset-0 z-[90] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-zinc-900/40"
        aria-label="Close menu"
        onClick={() => {
          if (!backdropCloseAllowed.current) return;
          onClose();
        }}
      />
      <div
        className="absolute left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-[min(20rem,calc(100vw-2.5rem))] max-w-[85vw] flex-col bg-[#F1F8F1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-emerald-100/90 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-950">Menu</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-zinc-600 hover:bg-emerald-100"
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 pb-4 pt-2">
          <div className="flex min-h-0 flex-1 flex-col">
            <FeedLeftSidebar
              embedded
              showEventSection={false}
              profileName={profileName}
              profileImageUrl={profileImageUrl}
              myEvents={myEvents}
              otherEvents={otherEvents}
              followedEvents={followedEvents}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
