"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithGoogle, signupWithPassword } from "@/app/auth/actions";
import { ArrowRight, Email, Google, Password } from "griddy-icons";

const initialState = { error: "" };

export default function SignupForm() {
  const [state, signupAction, pending] = useActionState(
    signupWithPassword,
    initialState,
  );

  return (
    <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-8 shadow-2xl">
      <p className="text-center text-sm font-bold text-emerald-800">PetSpot</p>
      <h1 className="mt-2 text-center text-4xl font-black tracking-tight text-zinc-900">
        Join the pack today!
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-600">
        Curate your pet&apos;s life with the community that cares.
      </p>

      <form action={signInWithGoogle} className="mt-6">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#eef4e8] px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-[#e6efde]"
        >
          <Google size={18} />
          Continue with Google
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] font-semibold tracking-widest text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        OR WITH EMAIL
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <form action={signupAction} className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#f4f8f1] px-3">
          <Email size={18} color="#6b7280" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            autoComplete="email"
            className="w-full bg-transparent py-2.5 text-sm text-zinc-900 focus:outline-none"
            required
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#f4f8f1] px-3">
          <Password size={18} color="#6b7280" />
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 characters)"
            autoComplete="new-password"
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
          <span>{pending ? "Creating account..." : "Create account"}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-emerald-700">
          Log in to your account
        </Link>
      </p>
    </div>
  );
}
