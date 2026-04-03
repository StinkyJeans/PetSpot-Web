import Link from "next/link";
import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import MainAppChrome from "@/components/layout/main-app-chrome";
import RouteSnapshotWriter from "@/components/navigation/route-snapshot-writer";
import { SearchPageRecentList, SearchRecentRecorder } from "@/components/search/search-recent-client";
import { getOptimizedImageUrl } from "@/lib/imageUrl";
import { searchPack } from "@/app/search/actions";

function Avatar({ url, label }) {
  const src = url ? getOptimizedImageUrl(url, { width: 96, height: 96, quality: 75 }) : "";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote Supabase URLs; matches feed avatars
      <img
        src={src}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-emerald-100"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
      {label.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default async function SearchPage({ searchParams }) {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);

  const sp = await searchParams;
  const rawQ = sp?.q;
  const q = typeof rawQ === "string" ? rawQ : "";

  const { users, pages, communities } = await searchPack(q);

  const searchSnapshot = {
    title: "Search",
    query: q.trim().slice(0, 80),
  };

  const total = users.length + pages.length + communities.length;
  const trimmed = q.trim();
  const hint =
    trimmed.length === 0
      ? "Use the search bar to find people, pet profiles, events, and community."
      : trimmed.length < 2
        ? "Enter at least 2 characters to search."
        : total === 0
          ? "No matches for that search."
          : null;

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <RouteSnapshotWriter routeKey="/search" snapshot={searchSnapshot} />
      <MainAppChrome searchInitialQuery={q}>
        <SearchRecentRecorder query={q} />

        <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900">Search</h1>
        {hint ? <p className="mt-2 text-sm text-zinc-600">{hint}</p> : null}
        <SearchPageRecentList query={q} />

        {users.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Users</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {users.map((u) => (
                <li key={u.ownerId}>
                  <Link
                    href={u.href}
                    className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:bg-emerald-50/80"
                  >
                    <Avatar url={u.avatarUrl} label={u.headline} />
                    <span className="font-medium text-zinc-900">{u.headline}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {pages.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Pages</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {pages.map((p) => (
                <li key={`${p.kind}-${p.id}`}>
                  <Link
                    href={p.href}
                    className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:bg-emerald-50/80"
                  >
                    {p.kind === "pet" ? (
                      <Avatar url={p.avatarUrl ?? ""} label={p.title} />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                        Ev
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-zinc-900">{p.title}</span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium uppercase text-zinc-600">
                          {p.kind === "pet" ? "Pet" : "Event"}
                        </span>
                      </div>
                      {p.subtitle ? <p className="mt-0.5 text-sm text-zinc-500">{p.subtitle}</p> : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {communities.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Communities</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {communities.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.href}
                    className="block rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:bg-emerald-50/80"
                  >
                    <span className="font-medium text-zinc-900">{c.name}</span>
                    {c.subtitle ? <p className="mt-1 text-sm text-zinc-500">{c.subtitle}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      </MainAppChrome>
    </div>
  );
}
