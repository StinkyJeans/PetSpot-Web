"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePetAbout } from "@/app/profile/actions";

export default function ProfileAboutCard({ aboutMe }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await updatePetAbout(null, fd);
      if (r?.error) {
        setError(r.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <section id="about-section" className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-emerald-950">Bio</h2>
        <button
          type="button"
          onClick={() => {
            setError("");
            setEditing((v) => !v);
          }}
          className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <textarea
            key={aboutMe ?? ""}
            name="about_me"
            rows={5}
            defaultValue={aboutMe ?? ""}
            placeholder="Introduce yourself and your pet — adventures, personality, what you love to share..."
            className="w-full rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </form>
      ) : (
        <p className="mt-3 break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-zinc-700">
          {aboutMe?.trim()
            ? aboutMe
            : "Add a bio — tell the pack about you and your pet, what you post, and what makes your duo special."}
        </p>
      )}
    </section>
  );
}
