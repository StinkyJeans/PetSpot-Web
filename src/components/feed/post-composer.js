"use client";

import { useActionState } from "react";
import { createPost } from "@/app/feed/actions";

const initialState = { error: "" };

export default function PostComposer() {
  const [state, action, pending] = useActionState(createPost, initialState);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Create Post</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Share photos, videos, favorite spots, toys, or moments with you and your pet.
      </p>
      <form action={action} className="mt-4 space-y-3">
        <textarea
          name="caption"
          placeholder="What are you and your pet up to?"
          rows={4}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
          required
        />
        <input
          name="mediaFile"
          type="file"
          accept="image/*,video/*"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        />
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? "Posting..." : "Publish Post"}
        </button>
      </form>
    </section>
  );
}
