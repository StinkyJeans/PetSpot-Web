"use client";

export default function ViewAllEvent({
  isOpen,
  onClose,
  title = "All your events",
  events = [],
  onEdit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-zinc-500">No events yet.</p>
        ) : (
          <div className="max-h-[65vh] space-y-3 overflow-auto pr-1">
            {events.map((item) => (
              <article key={item.id ?? `${item.title}-${item.when}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-600">{item.when}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{item.location}</p>
                {item.purpose ? <p className="mt-1 text-xs text-zinc-700">{item.purpose}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
