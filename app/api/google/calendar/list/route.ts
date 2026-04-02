import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken } from "@/lib/google-auth";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = await getAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "Not connected" }, { status: 403 });

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 502 });

  const data = await res.json();

  const calendars = (data.items ?? []).map((c: {
    id: string;
    summary: string;
    backgroundColor: string;
    primary?: boolean;
  }) => ({
    id: c.id,
    name: c.summary,
    color: c.backgroundColor ?? "#6366F1",
    is_primary: c.primary ?? false,
  }));

  return NextResponse.json({ calendars });
}
