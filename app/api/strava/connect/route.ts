import { NextResponse } from "next/server";
import { getStravaAuthUrl } from "@/lib/strava";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // Hardcode to match Strava API settings
  const redirectUri = "https://10k-run.vercel.app/api/strava/callback";

  try {
    const authUrl = getStravaAuthUrl(redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Strava connect error:", error);
    return NextResponse.redirect(new URL("/profile?strava=error", origin));
  }
}
