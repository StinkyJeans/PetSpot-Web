"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { loginWithPassword, signInWithGoogle } from "@/app/auth/actions";
import LoginPasswordChangeHint from "@/components/auth/login-password-change-hint";
import { ArrowRight, Email, Eye, EyeOff, Google, Password } from "griddy-icons";
import { useToast } from "@/components/feedback/toast-provider";

const initialState = { error: "", passwordChangedAt: null };

export default function LoginForm({ initialError, initialSuccess }) {
  const [state, loginAction, pending] = useActionState(
    loginWithPassword,
    initialState,
  );
  const error = state?.error || initialError;
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!initialSuccess) return;
    showToast(initialSuccess, "success");
  }, [initialSuccess, showToast]);

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
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-zinc-900 focus:outline-none"
            required
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
        <p className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
        {error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {state?.passwordChangedAt ? (
          <LoginPasswordChangeHint iso={state.passwordChangedAt} />
        ) : null}
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
