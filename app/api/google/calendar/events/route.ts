import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken } from "@/lib/google-auth";
import type { CalendarEvent } from "@/types/calendar";

// Maps Google colorId to hex
const GOOGLE_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = await getAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "Not connected" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const calendarIds = searchParams.getAll("calendarId");
  const timeMin = searchParams.get("timeMin") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = searchParams.get("timeMax") ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  if (calendarIds.length === 0) return NextResponse.json({ events: [] });

  const allEvents: CalendarEvent[] = [];

  await Promise.all(
    calendarIds.map(async (calId) => {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) return;

      const data = await res.json();

      for (const item of data.items ?? []) {
        if (item.status === "cancelled") continue;

        const allDay = !!item.start?.date;
        const color = item.colorId
          ? (GOOGLE_COLORS[item.colorId] ?? "#6366F1")
          : "#6366F1";

        allEvents.push({
          id: item.id,
          title: item.summary ?? "(No title)",
          start: item.start,
          end: item.end,
          all_day: allDay,
          color,
          location: item.location,
          description: item.description,
          calendar_id: calId,
          recurrence: item.recurrence,
          attendees: item.attendees,
          status: item.status ?? "confirmed",
          created_at: item.created ?? new Date().toISOString(),
        });
      }
    })
  );

  return NextResponse.json({ events: allEvents });
}
