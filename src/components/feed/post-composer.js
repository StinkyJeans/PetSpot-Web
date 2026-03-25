"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createPost } from "@/app/feed/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildUserMediaPath } from "@/lib/storage/helpers";

export default function PostComposer() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const caption = String(fd.get("caption") ?? "").trim();
    const file = fd.get("mediaFile");

    if (!caption) {
      setError("Caption is required.");
      return;
    }

    startTransition(async () => {
      try {
        if (
          file &&
          typeof file === "object" &&
          "size" in file &&
          file.size > 0 &&
          typeof file.arrayBuffer === "function"
        ) {
          const supabase = getSupabaseBrowserClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            setError("You must be signed in.");
            return;
          }
          const kind = file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("image/")
              ? "image"
              : null;
          if (!kind) {
            setError("Only image or video files are allowed.");
            return;
          }
          const folder = kind === "image" ? "images" : "videos";
          const path = buildUserMediaPath(user.id, folder, file.name);
          const { error: upErr } = await supabase.storage.from("media-post").upload(path, file, {
            contentType: file.type || undefined,
            upsert: false,
          });
          if (upErr) {
            setError(upErr.message || "Could not upload media.");
            return;
          }
          const { data: pub } = supabase.storage.from("media-post").getPublicUrl(path);
          fd.append("mediaUrl", pub.publicUrl);
          fd.append("mediaKind", kind);
          fd.delete("mediaFile");
        }

        const r = await createPost(null, fd);
        if (r?.error) {
          setError(r.error);
          return;
        }
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        router.refresh();
      } catch (err) {
        setError(err?.message || "Something went wrong.");
      }
    });
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Create Post</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Share photos, videos, favorite spots, toys, or moments with you and your pet.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          name="caption"
          placeholder="What are you and your pet up to?"
          rows={4}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
          required
        />
        <input
          ref={fileInputRef}
          name="mediaFile"
          type="file"
          accept="image/*,video/*"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
