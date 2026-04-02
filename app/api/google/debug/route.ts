import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return NextResponse.json({
    clientId: { raw: clientId, trimmed: clientId.trim(), hasNewline: clientId.includes("\n") },
    clientSecret: { prefix: clientSecret.slice(0, 12), length: clientSecret.length, trimmedLength: clientSecret.trim().length, hasNewline: clientSecret.includes("\n") },
    appUrl: { raw: appUrl, trimmed: appUrl.trim(), hasNewline: appUrl.includes("\n"), hasTrailingSlash: appUrl.endsWith("/") },
    redirectUri: `${appUrl.trim().replace(/\/$/, "")}/api/google/calendar/callback`,
  });
}
