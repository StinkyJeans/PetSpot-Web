"use client";

import { useCallback } from "react";
import { useToast } from "@/components/feedback/toast-provider";

/** Default copy for delete actions (toast or other callers). */
export const DELETE_FEEDBACK_MESSAGES = {
  success: "Deleted successfully.",
  error: "Delete failed.",
};

/**
 * Reusable delete feedback via the global toast.
 * Use from any client component that performs a delete (posts, comments, etc.).
 */
export function useDeleteFeedback(durationMs = 2000) {
  const { showToast } = useToast();

  const notifyDeleted = useCallback(() => {
    showToast(DELETE_FEEDBACK_MESSAGES.success, "success", durationMs);
  }, [showToast, durationMs]);

  const notifyDeleteFailed = useCallback(
    (serverMessage) => {
      const msg =
        typeof serverMessage === "string" && serverMessage.trim()
          ? serverMessage.trim()
          : DELETE_FEEDBACK_MESSAGES.error;
      showToast(msg, "error", durationMs);
    },
    [showToast, durationMs],
  );

  return { notifyDeleted, notifyDeleteFailed };
}
