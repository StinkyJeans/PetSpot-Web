"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { loginWithPassword, signInWithGoogle } from "@/app/auth/actions";
import { ArrowRight, Email, Google, Password } from "griddy-icons";
import { useToast } from "@/components/feedback/toast-provider";

const initialState = { error: "" };

export default function LoginForm({ initialError, initialSuccess }) {
  const [state, loginAction, pending] = useActionState(
    loginWithPassword,
    initialState,
  );
  const error = state?.error || initialError;
  const { showToast } = useToast();
  const lastToastErrorRef = useRef("");

  useEffect(() => {
    if (!initialSuccess) return;
    showToast(initialSuccess, "success");
  }, [initialSuccess, showToast]);

  useEffect(() => {
    if (!error) return;
    if (lastToastErrorRef.current === error) return;
    lastToastErrorRef.current = error;
    showToast(error, "error");
  }, [error, showToast]);

  return (
    <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-8 shadow-2xl">
      <p className="text-center text-sm font-bold text-emerald-800">PetSpot</p>
      <h1 className="mt-2 text-center text-4xl font-black tracking-tight text-zinc-900">
        Welcome back
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-600">
        Log in to continue to PetSpot.
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

      <form action={loginAction} className="space-y-3">
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
            placeholder="Password"
            autoComplete="current-password"
            className="w-full bg-transparent py-2.5 text-sm text-zinc-900 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#184f24] px-4 py-3 text-sm font-semibold text-white hover:bg-[#123f1d] disabled:opacity-60"
        >
          <span>{pending ? "Logging in..." : "Log in"}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        Need an account?{" "}
        <Link href="/signup" className="font-semibold text-emerald-700">
          Sign up
        </Link>
      </p>
    </div>
  );
}
