import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import {
  exchangeStravaCode,
  fetchStravaActivities,
  stravaActivityToPayload,
} from "@/lib/strava";
import { getActiveChallenge } from "@/lib/challenge";
import { recomputeWeeklyResult } from "@/lib/weekly";

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

    // Import recent activities (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const activities = await fetchStravaActivities(
      tokenData.access_token,
      thirtyDaysAgo,
      50
    );

    if (activities.length > 0) {
      const challenge = await getActiveChallenge(supabase);

      for (const activity of activities) {
        // Skip if activity already imported
        const { data: existing } = await supabase
          .from("activities")
          .select("id")
          .eq("strava_activity_id", activity.id)
          .maybeSingle();

        if (existing) continue;

        // Create activity
        const payload = stravaActivityToPayload(
          activity,
          session.user.id,
          challenge.id
        );

        const { error: insertError } = await supabase
          .from("activities")
          .insert(payload as any);

        if (!insertError) {
          // Recompute weekly result
          await recomputeWeeklyResult(supabase, {
            userId: session.user.id,
            challenge,
            activityDate: payload.activity_date,
          });
        }
      }
    }

    return response;
  } catch (err) {
    console.error("Strava connection error:", err);
    return NextResponse.redirect(new URL("/profile?strava=error", origin));
  }
}
