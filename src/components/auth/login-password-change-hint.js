"use client";

import { useSpokenTimeAgo } from "@/lib/time/live-relative-time";

export default function LoginPasswordChangeHint({ iso }) {
  const spoken = useSpokenTimeAgo(iso);
  if (!spoken) return null;
  return (
    <p className="text-sm font-medium leading-snug text-red-600" role="alert">
      You changed your password {spoken}. Use your new password, or use Forgot password if you need
      another reset.
    </p>
  );
}
