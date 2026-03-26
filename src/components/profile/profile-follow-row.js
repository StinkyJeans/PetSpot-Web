"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleFollowUser } from "@/app/profile/follow-actions";
import { useToast } from "@/components/feedback/toast-provider";

export default function ProfileFollowRow({ targetUserId, isFollowing }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await toggleFollowUser(fd);
      if (result?.error) {
        showToast(result.error, "error");
        return;
      }
      if (result?.following) {
        showToast("You're now following this profile.", "success", 3200);
      } else {
        showToast("You unfollowed this profile.", "success", 2800);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form onSubmit={handleSubmit} className="inline">
        <input type="hidden" name="userId" value={targetUserId} />
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex min-w-[118px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 ${
            isFollowing
              ? "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              : "bg-emerald-900 text-white hover:bg-emerald-950"
          }`}
        >
          {pending ? "…" : isFollowing ? "+ Followed" : "+ Follow"}
        </button>
      </form>
      <button
        type="button"
        disabled
        title="Coming soon"
        className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-400"
      >
        Message
      </button>
    </div>
  );
}
