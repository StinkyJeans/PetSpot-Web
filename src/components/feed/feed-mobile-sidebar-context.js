"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import FeedMobileSidebarDrawer from "@/components/feed/feed-mobile-sidebar-drawer";

const FeedMobileSidebarContext = createContext(null);

export function FeedMobileSidebarProvider({
  children,
  profileName,
  profileImageUrl,
  myEvents = [],
  otherEvents = [],
  followedEvents = [],
}) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = useMemo(
    () => ({ open, setOpen, toggle, close }),
    [open, toggle, close],
  );

  return (
    <FeedMobileSidebarContext.Provider value={value}>
      {children}
      {open ? (
        <FeedMobileSidebarDrawer
          onClose={close}
          profileName={profileName}
          profileImageUrl={profileImageUrl}
          myEvents={myEvents}
          otherEvents={otherEvents}
          followedEvents={followedEvents}
        />
      ) : null}
    </FeedMobileSidebarContext.Provider>
  );
}

export function useFeedMobileSidebar() {
  return useContext(FeedMobileSidebarContext);
}
