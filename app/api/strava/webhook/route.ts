import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  fetchStravaActivity,
  stravaActivityToPayload,
  getValidStravaToken,
} from "@/lib/strava";
import { getActiveChallenge } from "@/lib/challenge";
import { recomputeWeeklyResult } from "@/lib/weekly";

// Strava webhook verification (GET request)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Strava webhook verified");
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Strava webhook events (POST request)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Only handle activity create events
    if (body.object_type !== "activity" || body.aspect_type !== "create") {
      return NextResponse.json({ status: "ignored" });
    }

    const stravaAthleteId = body.owner_id;
    const stravaActivityId = body.object_id;

    const adminClient = createAdminSupabaseClient();

    // Find user by Strava athlete ID
    const { data: connection } = await (adminClient as any)
      .from("strava_connections")
      .select("user_id, access_token, refresh_token, expires_at")
      .eq("strava_athlete_id", stravaAthleteId)
      .single();

    if (!connection) {
      console.log("No connection found for Strava athlete:", stravaAthleteId);
      return NextResponse.json({ status: "no_user" });
    }

    // Check if activity already exists
    const { data: existing } = await (adminClient as any)
      .from("activities")
      .select("id")
      .eq("strava_activity_id", stravaActivityId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: "already_exists" });
    }

    // Get valid access token (may need refresh)
    const accessToken = await getValidStravaToken(adminClient, connection.user_id);
    if (!accessToken) {
      console.error("Failed to get valid Strava token for user:", connection.user_id);
      return NextResponse.json({ status: "token_error" });
    }

    // Fetch activity details from Strava
    const stravaActivity = await fetchStravaActivity(accessToken, stravaActivityId);

    // Get challenge
    const challenge = await getActiveChallenge(adminClient);

    // Create activity
    const payload = stravaActivityToPayload(
      stravaActivity,
      connection.user_id,
      challenge.id
    );

    const { error: insertError } = await (adminClient as any)
      .from("activities")
      .insert(payload);

    if (insertError) {
      console.error("Failed to insert Strava activity:", insertError);
      return NextResponse.json({ status: "insert_error" });
    }

    // Recompute weekly result
    await recomputeWeeklyResult(adminClient, {
      userId: connection.user_id,
      challenge,
      activityDate: payload.activity_date,
    });

    console.log("Imported Strava activity:", stravaActivityId, "for user:", connection.user_id);
    return NextResponse.json({ status: "created" });
  } catch (error) {
    console.error("Strava webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
