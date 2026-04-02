import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/calendar/calendarService";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import type { CalendarView, CalendarEvent } from "@/types/calendar";
import { useCalendarPrefs, useGoogleCalendarStatus } from "@/hooks/useGoogleCalendar";

function getDateRange(view: CalendarView, date: Date): { start: Date; end: Date } {
  switch (view) {
    case "year": {
      const start = new Date(date.getFullYear(), 0, 1);
      const end = new Date(date.getFullYear(), 11, 31);
      return { start, end };
    }
    case "month": {
      const start = startOfMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      const end = endOfMonth(start);
      return {
        start: startOfWeek(start, { weekStartsOn: 0 }),
        end: endOfWeek(end, { weekStartsOn: 0 }),
      };
    }
    case "week": {
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      };
    }
    case "day":
    default: {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      return { start, end };
    }
  }
}

export function useEvents(view: CalendarView, date: Date) {
  const { start, end } = getDateRange(view, date);
  const startISO = format(start, "yyyy-MM-dd'T'HH:mm:ssxxx");
  const endISO = format(end, "yyyy-MM-dd'T'HH:mm:ssxxx");
  const startKey = format(start, "yyyy-MM-dd");
  const endKey = format(end, "yyyy-MM-dd");

  const { data: status } = useGoogleCalendarStatus();
  const { data: calendarIds = [] } = useCalendarPrefs();
  const connected = status?.connected ?? false;

  return useQuery<CalendarEvent[]>({
    queryKey: ["events", startKey, endKey, connected, calendarIds],
    queryFn: async () => {
      if (!connected || calendarIds.length === 0) {
        return getEvents(start, end);
      }
      const params = new URLSearchParams({ timeMin: startISO, timeMax: endISO });
      calendarIds.forEach((id) => params.append("calendarId", id));
      const res = await fetch(`/api/google/calendar/events?${params}`);
      if (!res.ok) return getEvents(start, end);
      const data = await res.json();
      return data.events ?? [];
    },
    staleTime: 2 * 60_000,
  });
}
