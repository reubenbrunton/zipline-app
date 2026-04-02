import { NextResponse } from "next/server";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ");

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");
  const redirectUri = `${appUrl}/api/google/calendar/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
