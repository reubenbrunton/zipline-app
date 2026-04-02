import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAccessToken } from "@/lib/google-auth";
import type { CalendarEvent } from "@/types/calendar";

const GOOGLE_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

// GET — list calendars shared with me
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fetchEvents = searchParams.get("events") === "true";

  // Get shares directed at this user
  const { data: shares } = await supabase
    .from("calendar_shares")
    .select("id, calendar_id, calendar_name, calendar_color, owner_id")
    .eq("shared_with", user.id);

  if (!shares || shares.length === 0) {
    return NextResponse.json(fetchEvents ? { events: [] } : { calendars: [] });
  }

  if (!fetchEvents) {
    return NextResponse.json({
      calendars: shares.map((s) => ({
        id: s.calendar_id,
        name: s.calendar_name ?? s.calendar_id,
        color: s.calendar_color ?? "#6366F1",
        owner_id: s.owner_id,
      })),
    });
  }

  // Fetch events using each owner's token
  const timeMin = searchParams.get("timeMin") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = searchParams.get("timeMax") ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  // Group shares by owner
  const byOwner: Record<string, typeof shares> = {};
  for (const share of shares) {
    if (!byOwner[share.owner_id]) byOwner[share.owner_id] = [];
    byOwner[share.owner_id].push(share);
  }

  const allEvents: CalendarEvent[] = [];

  await Promise.all(
    Object.entries(byOwner).map(async ([ownerId, ownerShares]) => {
      const accessToken = await getAccessToken(ownerId);
      if (!accessToken) return;

      await Promise.all(
        ownerShares.map(async (share) => {
          const params = new URLSearchParams({
            timeMin, timeMax,
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "250",
          });

          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(share.calendar_id)}/events?${params}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!res.ok) return;
          const data = await res.json();

          for (const item of data.items ?? []) {
            if (item.status === "cancelled") continue;
            const calColor = share.calendar_color ?? "#6366F1";
            const color = item.colorId ? (GOOGLE_COLORS[item.colorId] ?? calColor) : calColor;

            allEvents.push({
              id: `shared-${share.owner_id}-${item.id}`,
              title: item.summary ?? "(No title)",
              start: item.start,
              end: item.end,
              all_day: !!item.start?.date,
              color,
              location: item.location,
              description: item.description,
              calendar_id: share.calendar_id,
              attendees: item.attendees,
              status: item.status ?? "confirmed",
              created_at: item.created ?? new Date().toISOString(),
            });
          }
        })
      );
    })
  );

  return NextResponse.json({ events: allEvents });
}
