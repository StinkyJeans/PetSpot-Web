"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const MessagesMobileSidebarContext = createContext(null);

export function MessagesMobileSidebarProvider({ children }) {
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
    <MessagesMobileSidebarContext.Provider value={value}>
      {children}
    </MessagesMobileSidebarContext.Provider>
  );
}

export function useMessagesMobileSidebar() {
  return useContext(MessagesMobileSidebarContext);
}
