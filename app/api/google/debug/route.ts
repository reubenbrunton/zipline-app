import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken } from "@/lib/google-auth";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Check token + try fetching calendars
  let tokenStatus = "no user";
  let calendarResult: unknown = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const accessToken = await getAccessToken(user.id);
      tokenStatus = accessToken ? "token ok" : "no token in DB";

      if (accessToken) {
        const res = await fetch(
          "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const body = await res.json();
        calendarResult = { status: res.status, body };
      }
    }
  } catch (e) {
    tokenStatus = String(e);
  }

  return NextResponse.json({
    clientId: { length: clientId.length, trimmedLength: clientId.trim().length, hasNewline: clientId.includes("\n") },
    clientSecret: { length: clientSecret.length, trimmedLength: clientSecret.trim().length },
    appUrl: appUrl.trim(),
    tokenStatus,
    calendarResult,
  });
}
