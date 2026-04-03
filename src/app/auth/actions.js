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

  // No session only when Supabase has "Confirm email" enabled (Auth → Providers → Email).
  // If that toggle is off, signUp returns a session immediately and the user goes to onboarding below.
  if (!data?.session) {
    return { success: true, needsEmailConfirmation: true };
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

export async function requestPasswordReset(_, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await getSupabaseServerClient();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?recovery=1`,
  });

  if (error) {
    return { error: normalizeError(error, "Could not send reset email.") };
  }

  // Always show success (Supabase does not reveal whether the email exists).
  return { success: true };
}

export async function updatePasswordAfterRecovery(_, formData) {
  const password = String(formData.get("password") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!password || !confirm) {
    return { error: "Please enter and confirm your new password." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: normalizeError(error, "Could not update password.") };
  }

  await supabase.auth.signOut();
  return { success: true };
}
