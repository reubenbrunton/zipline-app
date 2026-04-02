import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/calendar/calendarService";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import type { CalendarView, CalendarEvent } from "@/types/calendar";
import { useCalendarPrefs, useGoogleCalendarStatus, useGoogleCalendars, useSharedCalendars } from "@/hooks/useGoogleCalendar";

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
  const { data: calendars = [] } = useGoogleCalendars();
  const { data: sharedCalendars = [] } = useSharedCalendars();
  const connected = status?.connected ?? false;

  return useQuery<CalendarEvent[]>({
    queryKey: ["events", startKey, endKey, connected, calendarIds, sharedCalendars.map((c) => c.id)],
    queryFn: async () => {
      if (!connected && sharedCalendars.length === 0) {
        return getEvents(start, end);
      }

      const results: CalendarEvent[] = [];

      // Own calendars
      if (connected && calendarIds.length > 0) {
        const params = new URLSearchParams({ timeMin: startISO, timeMax: endISO });
        calendarIds.forEach((id) => {
          params.append("calendarId", id);
          const cal = calendars.find((c) => c.id === id);
          params.append("calendarColor", cal?.color ?? "#6366F1");
        });
        const res = await fetch(`/api/google/calendar/events?${params}`);
        if (res.ok) {
          const data = await res.json();
          results.push(...(data.events ?? []));
        }
      }

      // Shared calendars
      if (sharedCalendars.length > 0) {
        const params = new URLSearchParams({ timeMin: startISO, timeMax: endISO, events: "true" });
        const res = await fetch(`/api/google/calendar/shared-with-me?${params}`);
        if (res.ok) {
          const data = await res.json();
          results.push(...(data.events ?? []));
        }
      }

      return results.length > 0 ? results : getEvents(start, end);
    },
    staleTime: 2 * 60_000,
  });
}
