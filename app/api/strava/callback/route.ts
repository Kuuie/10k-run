import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { exchangeStravaCode } from "@/lib/strava";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle errors from Strava
  if (error) {
    console.error("Strava OAuth error:", error);
    return NextResponse.redirect(new URL("/profile?strava=error", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/profile?strava=error", origin));
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL("/profile?strava=connected", origin));

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Get current user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/?error=not_authenticated", origin));
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeStravaCode(code);

    // Store connection
    await supabase.from("strava_connections").upsert(
      {
        user_id: session.user.id,
        strava_athlete_id: tokenData.athlete.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      },
      { onConflict: "user_id" }
    );

    // New activities will be imported via webhook going forward
    return response;
  } catch (err) {
    console.error("Strava connection error:", err);
    return NextResponse.redirect(new URL("/profile?strava=error", origin));
  }
}
