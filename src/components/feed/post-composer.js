"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPost } from "@/app/feed/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildUserMediaPath } from "@/lib/storage/helpers";

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    label: "😀",
    title: "Smileys",
    emojis: ["😀", "😄", "😁", "😂", "😊", "😍", "🥰", "😘", "😎", "🤩"],
  },
  {
    id: "animals",
    label: "🐶",
    title: "Animals",
    emojis: ["🐶", "🐱", "🐾", "🦴", "🐕", "🐈", "🦜", "🐹", "🐰", "🦮"],
  },
  {
    id: "hearts",
    label: "❤️",
    title: "Hearts",
    emojis: ["❤️", "💚", "💛", "💙", "💜", "🧡", "🤍", "🤎", "🩷", "🩵"],
  },
  {
    id: "celebration",
    label: "🎉",
    title: "Celebration",
    emojis: ["🎉", "✨", "🥳", "📸", "🔥", "🙌", "👏", "⭐", "🎈", "🎊"],
  },
];
const RECENT_EMOJI_KEY = "petspot_recent_emojis_v1";
const RECENT_EMOJI_LIMIT = 12;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

function initialFromName(name) {
  const clean = String(name ?? "").trim();
  if (!clean) return "?";
  return clean.slice(0, 1).toUpperCase();
}

export default function PostComposer({ viewerName = "PetSpot User", viewerAvatarUrl = "" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState("smileys");
  const [recentEmojis, setRecentEmojis] = useState([]);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!emojiOpen) return;
      const panel = emojiPanelRef.current;
      if (panel && !panel.contains(e.target)) {
        setEmojiOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [emojiOpen]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_EMOJI_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const next = parsed.filter((v) => typeof v === "string").slice(0, RECENT_EMOJI_LIMIT);
        queueMicrotask(() => setRecentEmojis(next));
      }
    } catch {
      // Ignore storage parse errors.
    }
  }, []);

  function rememberRecentEmoji(emoji) {
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, RECENT_EMOJI_LIMIT);
      try {
        localStorage.setItem(RECENT_EMOJI_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors.
      }
      return next;
    });
  }

  function insertEmoji(emoji) {
    const ta = textareaRef.current;
    if (!ta) {
      setCaption((prev) => `${prev}${emoji}`);
      return;
    }

    const start = ta.selectionStart ?? caption.length;
    const end = ta.selectionEnd ?? caption.length;
    const next = `${caption.slice(0, start)}${emoji}${caption.slice(end)}`;
    setCaption(next);
    queueMicrotask(() => {
      ta.focus();
      const cursor = start + emoji.length;
      ta.setSelectionRange(cursor, cursor);
    });
    rememberRecentEmoji(emoji);
  }

  const activeCategory =
    EMOJI_CATEGORIES.find((c) => c.id === emojiCategory) ?? EMOJI_CATEGORIES[0];

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
          if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
            setError("Video is too large. Maximum allowed size is 50MB.");
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
        setCaption("");
        setEmojiOpen(false);
        setEmojiCategory("smileys");
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
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <header className="border-b border-emerald-100 pb-2">
        <h2 className="text-center text-lg font-bold text-zinc-900">Create Post</h2>
      </header>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100">
            {viewerAvatarUrl ? (
              <img src={viewerAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-emerald-900">
                {initialFromName(viewerName)}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{viewerName}</p>
            <p className="text-[11px] font-semibold text-zinc-500">Custom</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            name="caption"
            value={caption}
            onChange={(e) => setCaption(e.currentTarget.value)}
            placeholder={`What's on your mind, ${String(viewerName).split(" ")[0] || "there"}?`}
            rows={4}
            className="w-full resize-none rounded-xl border border-emerald-100 bg-[#f8fcf8] px-2 py-2 pr-12 text-xl/[1.2] font-medium text-zinc-800 placeholder:text-zinc-500 focus:border-emerald-300 focus:outline-none"
            required
          />
          <button
            type="button"
            className="absolute bottom-2 right-2 rounded-full p-1 text-lg hover:bg-emerald-100"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Add emoji"
          >
            🙂
          </button>
          {emojiOpen ? (
            <div
              ref={emojiPanelRef}
              className="absolute bottom-12 right-0 z-20 w-64 rounded-xl border border-emerald-100 bg-white p-2 shadow-lg"
            >
              {recentEmojis.length ? (
                <div className="mb-2 border-b border-emerald-100 pb-2">
                  <p className="px-1 pb-1 text-xs font-semibold text-zinc-500">Recently used</p>
                  <div className="grid grid-cols-7 gap-1">
                    {recentEmojis.map((emoji) => (
                      <button
                        key={`recent-${emoji}`}
                        type="button"
                        className="rounded p-1.5 text-lg hover:bg-emerald-50"
                        onClick={() => insertEmoji(emoji)}
                        aria-label={`Insert recent ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-zinc-500">{activeCategory.title}</p>
                <div className="flex items-center gap-1">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`rounded px-1.5 py-1 text-sm ${
                        emojiCategory === cat.id
                          ? "bg-emerald-100 text-emerald-900"
                          : "hover:bg-emerald-50"
                      }`}
                      onClick={() => setEmojiCategory(cat.id)}
                      aria-label={`Emoji category ${cat.title}`}
                      title={cat.title}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {activeCategory.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded p-1.5 text-lg hover:bg-emerald-50"
                    onClick={() => insertEmoji(emoji)}
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          name="mediaFile"
          type="file"
          accept="image/*,video/*"
          className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-1 file:text-emerald-900 focus:border-emerald-300 focus:outline-none"
        />
        <p className="text-xs font-medium text-zinc-500">Video uploads: maximum 50MB.</p>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? "Posting..." : "Post"}
        </button>
      </form>
    </section>
  );
}
