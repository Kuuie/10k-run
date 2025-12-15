import { NextResponse } from "next/server";
import { getStravaAuthUrl } from "@/lib/strava";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // Use SITE_URL if available, otherwise use request origin
  const siteUrl = process.env.SITE_URL || origin;
  const redirectUri = `${siteUrl}/api/strava/callback`;

  try {
    const authUrl = getStravaAuthUrl(redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Strava connect error:", error);
    return NextResponse.redirect(new URL("/profile?strava=error", origin));
  }
}
