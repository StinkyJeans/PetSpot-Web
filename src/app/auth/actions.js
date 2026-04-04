"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/** Shown on login after a successful recovery password update (server redirect avoids RSC revalidate race). */
const PASSWORD_RESET_LOGIN_SUCCESS_MESSAGE =
  "Password changed successfully. Now log in with your new password.";

function normalizeError(error, fallbackMessage) {
  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * OAuth and email redirect URLs must match the live site origin. Server actions
 * often omit the `Origin` header; use forwarded host/proto when needed.
 */
async function resolveAppOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;

  const forwardedHost = h.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = h.get("host");
  const effectiveHost = forwardedHost || host;
  if (effectiveHost) {
    const proto =
      forwardedProto ||
      (effectiveHost.includes("localhost") || effectiveHost.startsWith("127.") ? "http" : "https");
    return `${proto}://${effectiveHost}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Server actions must return plain JSON; coerce DB timestamps to ISO strings. */
function toPasswordHintIso(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

async function fetchPasswordChangeHintIso(supabase, email) {
  const { data: rpcData, error: rpcError } = await supabase.rpc("password_change_hint_for_email", {
    p_email: email,
  });
  if (!rpcError && rpcData != null) {
    const raw = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const iso = toPasswordHintIso(raw);
    if (iso) return iso;
  }

  const admin = getSupabaseServiceRoleClient();
  if (!admin) return null;
  const { data: row, error } = await admin
    .from("password_change_hints")
    .select("password_changed_at")
    .eq("email", email)
    .maybeSingle();
  if (error || row?.password_changed_at == null) return null;
  return toPasswordHintIso(row.password_changed_at);
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
  const origin = await resolveAppOrigin();

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
    const hintIso = await fetchPasswordChangeHintIso(supabase, email);
    const hasHint = Boolean(hintIso);
    return {
      error: hasHint
        ? "That email or password didn’t work."
        : normalizeError(error, "Invalid login credentials."),
      passwordChangedAt: hintIso,
    };
  }

  redirect("/feed");
}

export async function signInWithGoogle() {
  const supabase = await getSupabaseServerClient();
  const origin = await resolveAppOrigin();

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

/**
 * Password reset emails use Supabase Auth’s OTP / email-token lifetime (same family
 * as magic links). Default is often 3600s (1 hour). To use 10 minutes, set OTP
 * expiry to 600 seconds in the Supabase Dashboard (Authentication → search for
 * OTP / mailer / expiry), or `[auth] otp_expiry = 600` in local `config.toml`.
 */
export async function requestPasswordReset(_, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await getSupabaseServerClient();
  const origin = await resolveAppOrigin();

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id && user.email) {
    const { error: hintError } = await supabase.from("password_change_hints").upsert(
      {
        user_id: user.id,
        email: String(user.email).trim().toLowerCase(),
        password_changed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (hintError) {
      console.error("password_change_hints upsert failed:", hintError.message);
    }
  }

  await supabase.auth.signOut();
  redirect("/login?success=" + encodeURIComponent(PASSWORD_RESET_LOGIN_SUCCESS_MESSAGE));
}
