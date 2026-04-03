import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.origin;
  const emailConfirm = requestUrl.searchParams.get("email_confirm") === "1";
  const recovery = requestUrl.searchParams.get("recovery") === "1";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Missing+auth+code", redirectTo));
  }

  if (recovery) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    const response = NextResponse.redirect(new URL("/auth/reset-password", redirectTo));
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message || "Reset link is invalid or expired.")}`,
          redirectTo,
        ),
      );
    }

    return response;
  }

  if (emailConfirm) {
    // Complete email verification, then sign out so the user lands on the success page
    // and signs in explicitly from the login screen.
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    const response = NextResponse.redirect(new URL("/auth/email-confirmed", redirectTo));
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message || "Could not confirm your email.")}`,
          redirectTo,
        ),
      );
    }

    await supabase.auth.signOut();
    return response;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const response = NextResponse.redirect(new URL("/feed", redirectTo));
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=Unable+to+complete+sign-in", redirectTo),
    );
  }

  return response;
}
