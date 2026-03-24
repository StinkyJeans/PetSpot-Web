import { Plus } from "griddy-icons";

export default function FeedStories() {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex gap-4 overflow-x-auto pb-1">
        <button
          type="button"
          className="flex shrink-0 flex-col items-center gap-2 text-center"
          aria-label="Add story"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-800">
            <Plus size={28} />
          </span>
          <span className="max-w-[72px] truncate text-xs font-medium text-zinc-700">Add Story</span>
        </button>
      </div>
    </section>
  );
}
