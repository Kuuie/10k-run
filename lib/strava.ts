import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabase/types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
};

type StravaActivity = {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  type: string;
  sport_type: string;
  start_date_local: string;
};

export type ActivityType = "run" | "walk" | "jog" | "hike" | "cycle" | "swim" | "other";

// Map Strava activity types to our types
export function mapStravaType(stravaType: string): ActivityType {
  const typeMap: Record<string, ActivityType> = {
    Run: "run",
    Walk: "walk",
    Hike: "hike",
    Ride: "cycle",
    Swim: "swim",
    VirtualRun: "run",
    VirtualRide: "cycle",
    TrailRun: "run",
  };
  return typeMap[stravaType] || "other";
}

// Get the Strava OAuth URL
export function getStravaAuthUrl(redirectUri: string): string {
  const clientId = process.env.STRAVA_CLIENT_ID || "190235";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "activity:read_all",
    approval_prompt: "auto",
  });

  return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const clientId = process.env.STRAVA_CLIENT_ID || "190235";
  const clientSecret = process.env.STRAVA_CLIENT_SECRET || "cd3351411fd09529957eaea0eee945bd3b39bf2d";

  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Strava code: ${error}`);
  }

  return response.json();
}

// Refresh Strava access token
export async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
}> {
  const clientId = process.env.STRAVA_CLIENT_ID || "190235";
  const clientSecret = process.env.STRAVA_CLIENT_SECRET || "cd3351411fd09529957eaea0eee945bd3b39bf2d";

  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Strava token");
  }

  return response.json();
}

// Get valid access token (refreshing if needed)
export async function getValidStravaToken(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data: connection } = await (supabase as any)
    .from("strava_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!connection) return null;

  const now = new Date();
  const expiresAt = new Date(connection.expires_at);

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    try {
      const refreshed = await refreshStravaToken(connection.refresh_token);

      await (supabase as any)
        .from("strava_connections")
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
        })
        .eq("user_id", userId);

      return refreshed.access_token;
    } catch (error) {
      console.error("Failed to refresh Strava token:", error);
      return null;
    }
  }

  return connection.access_token;
}

// Fetch activities from Strava
export async function fetchStravaActivities(
  accessToken: string,
  after?: number, // Unix timestamp
  perPage = 30
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: String(perPage),
  });

  if (after) {
    params.set("after", String(after));
  }

  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Strava activities");
  }

  return response.json();
}

// Fetch a single activity from Strava
export async function fetchStravaActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  const response = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Strava activity");
  }

  return response.json();
}

// Get user's Strava connection status
export async function getStravaConnection(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ strava_athlete_id: number; created_at: string } | null> {
  const { data } = await (supabase as any)
    .from("strava_connections")
    .select("strava_athlete_id, created_at")
    .eq("user_id", userId)
    .single();

  return data;
}

// Disconnect Strava
export async function disconnectStrava(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  await (supabase as any).from("strava_connections").delete().eq("user_id", userId);
}

// Convert Strava activity to our format
export function stravaActivityToPayload(
  activity: StravaActivity,
  userId: string,
  challengeId: string
) {
  return {
    user_id: userId,
    challenge_id: challengeId,
    activity_date: activity.start_date_local.slice(0, 10),
    distance_km: Math.round((activity.distance / 1000) * 100) / 100, // meters to km, 2 decimal places
    duration_minutes: Math.round(activity.moving_time / 60),
    activity_type: mapStravaType(activity.type),
    source: "strava" as const,
    strava_activity_id: activity.id,
  };
}
