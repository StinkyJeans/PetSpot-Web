"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/auth/actions";
import { ArrowRight, Email } from "griddy-icons";

const initialState = { error: "", success: false };

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);

  if (state?.success) {
    return (
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-8 text-center shadow-2xl">
        <p className="text-sm font-bold text-emerald-800">PetSpot</p>
        <h1 className="mt-3 text-xl font-black tracking-tight text-zinc-900">Check your email</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#184f24] px-4 py-3 text-sm font-semibold text-white hover:bg-[#123f1d]"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-8 shadow-2xl">
      <p className="text-center text-sm font-bold text-emerald-800">PetSpot</p>
      <h1 className="mt-2 text-center text-3xl font-black tracking-tight text-zinc-900">
        Reset password
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-600">
        Enter your email and we&apos;ll send you a link to choose a new password.
      </p>

      <form action={action} className="mt-6 space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#f4f8f1] px-3">
          <Email size={18} color="#6b7280" />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            autoComplete="email"
            className="w-full bg-transparent py-2.5 text-sm text-zinc-900 focus:outline-none"
            required
          />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#184f24] px-4 py-3 text-sm font-semibold text-white hover:bg-[#123f1d] disabled:opacity-60"
        >
          <span>{pending ? "Sending…" : "Send reset link"}</span>
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
