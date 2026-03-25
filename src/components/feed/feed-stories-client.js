"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Plus } from "griddy-icons";
import { useStoriesRealtime } from "@/lib/stories/use-stories-realtime";
import { useToast } from "@/components/feedback/toast-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createStory } from "@/app/stories/actions";
import StoryViewerModal from "@/components/stories/story-viewer-modal";

function storyInitial(headline) {
  const s = String(headline ?? "").replace(/&/g, "").trim();
  if (!s) return "?";
  return s.slice(0, 1).toUpperCase();
}

export default function FeedStoriesClient({ viewerUserId, initialStories }) {
  const { stories, setStories } = useStoriesRealtime({
    viewerUserId,
    initialStories,
    enabled: true,
  });

  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadPending, startUploadTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const selectedStory = useMemo(
    () => stories.find((s) => s.id === selectedStoryId) ?? null,
    [selectedStoryId, stories],
  );

  const selectedIndex = useMemo(() => {
    if (!selectedStoryId) return -1;
    return stories.findIndex((s) => s.id === selectedStoryId);
  }, [selectedStoryId, stories]);

  function resetUploadModal() {
    setUploadError("");
    setSelectedFile(null);
    setSelectedPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex gap-4 overflow-x-auto pb-1">
        <button
          type="button"
          className="flex shrink-0 flex-col items-center gap-2 text-center"
          aria-label="Add story"
          onClick={() => {
            setUploadOpen(true);
          }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-800">
            <Plus size={28} />
          </span>
          <span className="max-w-[72px] truncate text-xs font-medium text-zinc-700">
            Add Story
          </span>
        </button>

        {stories.map((story) => {
          const ringClass = story.viewerHasViewed
            ? "border-zinc-200 bg-zinc-50"
            : "border-emerald-300 bg-emerald-50";

          return (
            <button
              key={story.id}
              type="button"
              className="flex shrink-0 flex-col items-center gap-2 text-center"
              aria-label={`Open story from ${story.authorHeadline}`}
              onClick={() => {
                setSelectedStoryId(story.id);
                if (!story.viewerHasViewed) {
                  setStories((prev) =>
                    prev.map((s) =>
                      s.id === story.id ? { ...s, viewerHasViewed: true } : s,
                    ),
                  );
                }
              }}
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${ringClass}`}
              >
                {story.authorAvatarUrl ? (
                  <img
                    src={story.authorAvatarUrl}
                    alt=""
                    className="h-[56px] w-[56px] rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[12px] font-bold text-emerald-900">
                    {storyInitial(story.authorHeadline)}
                  </span>
                )}
              </span>
              <span className="max-w-[72px] truncate text-xs font-semibold text-zinc-700">
                {story.authorHeadline}
              </span>
            </button>
          );
        })}
      </div>

      {uploadOpen ? (
        <div
          className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 p-2 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setUploadOpen(false);
            resetUploadModal();
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-bold text-zinc-900">Add a story</p>
              <button
                type="button"
                className="text-sm font-semibold text-zinc-500 hover:text-emerald-800"
                onClick={() => {
                  setUploadOpen(false);
                  resetUploadModal();
                }}
              >
                Close
              </button>
            </header>

            <div className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="block w-full text-sm text-zinc-700"
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0] ?? null;
                  setUploadError("");
                  setSelectedFile(f);
                  setSelectedPreviewUrl("");
                  if (f) {
                    setSelectedPreviewUrl(URL.createObjectURL(f));
                  }
                }}
              />

              {uploadError ? (
                <p className="mt-3 text-sm font-semibold text-red-600">{uploadError}</p>
              ) : null}

              {selectedPreviewUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl bg-black">
                  {selectedFile?.type?.startsWith("video/") ? (
                    <video
                      src={selectedPreviewUrl}
                      controls
                      className="max-h-[52vh] w-full object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedPreviewUrl}
                      alt=""
                      className="max-h-[52vh] w-full object-contain"
                    />
                  )}
                </div>
              ) : null}

              <button
                type="button"
                disabled={uploadPending || !selectedFile}
                className="mt-4 w-full rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
                onClick={() => {
                  if (!selectedFile) return;
                  startUploadTransition(async () => {
                    setUploadError("");
                    const file = selectedFile;
                    const kind = file.type.startsWith("video/")
                      ? "video"
                      : file.type.startsWith("image/")
                        ? "image"
                        : null;
                    if (!kind) {
                      setUploadError("Only image or video files are allowed.");
                      return;
                    }

                    try {
                      const storyId =
                        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                          ? crypto.randomUUID()
                          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

                      // Keep extension aligned with the actual file type so playback works.
                      const ext =
                        kind === "video"
                          ? file.type.includes("webm")
                            ? "webm"
                            : file.name.includes(".")
                              ? file.name.split(".").pop().toLowerCase()
                              : "mp4"
                          : file.type.includes("png")
                            ? "png"
                            : file.name.includes(".")
                              ? file.name.split(".").pop().toLowerCase()
                              : "jpg";

                      const supabase = getSupabaseBrowserClient();
                      // Bucket structure: media-stories/{user_id}/{story_id}.{ext}
                      const path = `${viewerUserId}/${storyId}.${ext}`;
                      const { error: upErr } = await supabase.storage
                        .from("media-stories")
                        .upload(path, file, {
                          contentType: file.type || undefined,
                          upsert: false,
                        });

                      if (upErr) {
                        showToast(upErr.message || "Could not upload story.", "error");
                        return;
                      }

                      const { data: pub } = supabase.storage
                        .from("media-stories")
                        .getPublicUrl(path);

                      const mediaUrl = pub?.publicUrl ?? "";
                      const fd = new FormData();
                      fd.append("mediaUrl", mediaUrl);
                      fd.append("mediaKind", kind);
                      fd.append("storyId", storyId);

                      const r = await createStory(null, fd);
                      if (r?.error) {
                        showToast(r.error, "error");
                        return;
                      }

                      const newStory = r.story;
                      if (newStory?.id) {
                        setStories((prev) => {
                          // Avoid duplicates if realtime INSERT arrives first.
                          const without = prev.filter((s) => s.id !== newStory.id);
                          return [newStory, ...without].sort((a, b) =>
                            String(b.createdAt).localeCompare(String(a.createdAt)),
                          );
                        });
                      }

                      setUploadOpen(false);
                      resetUploadModal();
                      showToast("Story posted.", "success");
                    } catch (err) {
                      setUploadError(err?.message || "Could not post story.");
                    }
                  });
                }}
              >
                {uploadPending ? "Posting..." : "Post Story"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedStory && selectedIndex >= 0 ? (
        <StoryViewerModal
          stories={stories}
          startIndex={selectedIndex}
          onClose={() => setSelectedStoryId(null)}
          onMarkSeen={(id) => {
            setStories((prev) =>
              prev.map((s) =>
                s.id === id ? { ...s, viewerHasViewed: true } : s,
              ),
            );
          }}
        />
      ) : null}
    </section>
  );
}

