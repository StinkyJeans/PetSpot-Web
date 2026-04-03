"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Same as feed drawer — avoids the opening tap closing the overlay immediately. */
const BACKDROP_CLOSE_DELAY_MS = 280;

export default function MessagesMobileSidebarDrawer({ open, onClose, children }) {
  const backdropCloseAllowed = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => {
      backdropCloseAllowed.current = true;
    }, BACKDROP_CLOSE_DELAY_MS);
    return () => {
      window.clearTimeout(id);
      backdropCloseAllowed.current = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      id="messages-mobile-sidebar"
      className="fixed inset-0 z-[90] touch-manipulation lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Conversations"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-zinc-900/40"
        aria-label="Close conversations"
        onClick={() => {
          if (!backdropCloseAllowed.current) return;
          onClose();
        }}
      />
      <div
        className="absolute left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-[min(22rem,calc(100vw-2rem))] max-w-[90vw] flex-col overflow-hidden bg-[#F1F8F1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-end border-b border-emerald-100/90 px-2 py-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-zinc-600 hover:bg-emerald-100"
            onClick={onClose}
            aria-label="Close conversations"
          >
            ×
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
