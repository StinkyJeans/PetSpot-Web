"use client";

import { useMemo, useState } from "react";
import { Grid } from "griddy-icons";

export default function ProfileGallery({ imageItems, videoItems }) {
  const [tab, setTab] = useState("photos");

  const grid = useMemo(() => {
    if (tab === "photos") return imageItems;
    if (tab === "videos") return videoItems;
    return [];
  }, [tab, imageItems, videoItems]);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex gap-4 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setTab("photos")}
            className={
              tab === "photos"
                ? "border-b-2 border-emerald-800 pb-1 text-emerald-950"
                : "pb-1 text-zinc-500 hover:text-emerald-900"
            }
          >
            Photos
          </button>
          <button
            type="button"
            onClick={() => setTab("videos")}
            className={
              tab === "videos"
                ? "border-b-2 border-emerald-800 pb-1 text-emerald-950"
                : "pb-1 text-zinc-500 hover:text-emerald-900"
            }
          >
            Videos
          </button>
          <button
            type="button"
            onClick={() => setTab("tagged")}
            className={
              tab === "tagged"
                ? "border-b-2 border-emerald-800 pb-1 text-emerald-950"
                : "pb-1 text-zinc-500 hover:text-emerald-900"
            }
          >
            Tagged
          </button>
        </div>
        <span className="text-zinc-400" title="Layout">
          <Grid size={20} color="currentColor" />
        </span>
      </div>

      {tab === "tagged" ? (
        <p className="py-12 text-center text-sm text-zinc-500">No tagged posts yet.</p>
      ) : grid.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          {tab === "photos" ? "No photos in your posts yet." : "No videos in your posts yet."}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {grid.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100"
            >
              {item.kind === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
