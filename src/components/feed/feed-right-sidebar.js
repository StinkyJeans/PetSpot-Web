export default function FeedRightSidebar({ children = null }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900">Trending Pack Members</h2>
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500">No suggestions yet.</p>
      </section>

      {children}

      <footer className="px-1 text-center text-xs text-zinc-400">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          <a href="#" className="hover:text-zinc-600">
            Privacy
          </a>
          <a href="#" className="hover:text-zinc-600">
            Terms
          </a>
          <a href="#" className="hover:text-zinc-600">
            Safety
          </a>
          <a href="#" className="hover:text-zinc-600">
            About
          </a>
        </div>
        <p className="mt-3 font-semibold text-emerald-900">PetSpot</p>
      </footer>
    </div>
  );
}
