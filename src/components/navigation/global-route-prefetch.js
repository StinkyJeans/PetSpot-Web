"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestRoutePrefetch } from "@/lib/navigation/prefetch";
import { APP_SHELL_PREFETCH_ROUTES } from "@/lib/navigation/route-snapshot";

/** Warms RSC payloads for main app routes on every full navigation tree (all pages). */
export default function GlobalRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    APP_SHELL_PREFETCH_ROUTES.forEach((href, index) => {
      // Stagger to avoid prefetch bursts that compete with first-view interactions.
      window.setTimeout(() => requestRoutePrefetch(router, href), 120 * index);
    });
  }, [router]);

  return null;
}
