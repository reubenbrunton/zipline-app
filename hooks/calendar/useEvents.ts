import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEvents } from "@/lib/calendar/calendarService";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import type { CalendarView } from "@/types/calendar";

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
      // Include surrounding week cells
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
  const startISO = format(start, "yyyy-MM-dd");
  const endISO = format(end, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["events", startISO, endISO],
    queryFn: () => getEvents(start, end),
    staleTime: 30_000,
  });
}
