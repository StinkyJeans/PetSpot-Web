<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Performance guardrails for new pages

- Add a minimal `RouteSnapshotWriter` snapshot for every top-level route.
- Use `useRouteSnapshot()` for loading shells; do not bypass TTL behavior.
- Keep initial data payload bounded (critical-first), then fetch or reveal non-critical content.
- Use guarded prefetch only (intent + connection-aware), avoid burst prefetching.
- Keep Supabase image transforms behind `NEXT_PUBLIC_ENABLE_IMAGE_TRANSFORMS=1` until validated.
- Videos in list/feed contexts should use `preload="metadata"` and a `poster` when available.
<!-- END:nextjs-agent-rules -->
