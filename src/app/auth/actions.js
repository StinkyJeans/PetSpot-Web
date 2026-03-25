"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function normalizeError(error, fallbackMessage) {
  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}

export async function signupWithPassword(_, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await getSupabaseServerClient();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Ensures the email confirmation link returns to the correct deployed host.
      emailRedirectTo: `${origin}/auth/callback?email_confirm=1`,
    },
  });

  if (error) {
    return { error: normalizeError(error, "Could not create your account.") };
  }

  if (!data?.session) {
    redirect(
      "/login?error=Account+created.+Please+confirm+your+email+before+logging+in.",
    );
  }

  redirect("/onboarding/pet");
}

export async function loginWithPassword(_, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: normalizeError(error, "Invalid login credentials.") };
  }

  redirect("/feed");
}

export async function signInWithGoogle() {
  const supabase = await getSupabaseServerClient();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent("Could not start Google sign-in.")}`);
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
