"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updatePasswordAfterRecovery } from "@/app/auth/actions";
import { ArrowRight, Eye, EyeOff, Password } from "griddy-icons";

const initialState = { error: "" };

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAfterRecovery, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-8 shadow-2xl">
      <p className="text-center text-sm font-bold text-emerald-800">PetSpot</p>
      <h1 className="mt-2 text-center text-3xl font-black tracking-tight text-zinc-900">
        New password
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-600">Choose a new password for your account.</p>

      <form action={action} className="mt-6 space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#f4f8f1] px-3">
          <Password size={18} color="#6b7280" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="New password (min 8 characters)"
            autoComplete="new-password"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-zinc-900 focus:outline-none"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-emerald-800 hover:bg-emerald-800/10 hover:text-emerald-950"
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#f4f8f1] px-3">
          <Password size={18} color="#6b7280" />
          <input
            type={showConfirm ? "text" : "password"}
            name="confirm"
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-zinc-900 focus:outline-none"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-emerald-800 hover:bg-emerald-800/10 hover:text-emerald-950"
            aria-pressed={showConfirm}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#184f24] px-4 py-3 text-sm font-semibold text-white hover:bg-[#123f1d] disabled:opacity-60"
        >
          <span>{pending ? "Saving…" : "Update password"}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        <Link href="/login" className="font-semibold text-emerald-700">
          Back to login
        </Link>
      </p>
    </div>
  );
}
