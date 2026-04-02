"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Calendar, CalendarEvent } from "@/types/calendar";

// ── Connection status ──────────────────────────────────────────────────────

export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const res = await fetch("/api/google/calendar/list");
      if (res.status === 403) return { connected: false };
      if (!res.ok) return { connected: false };
      return { connected: true };
    },
    staleTime: 30_000,
  });
}

// ── Available calendars ────────────────────────────────────────────────────

export function useGoogleCalendars() {
  return useQuery<Calendar[]>({
    queryKey: ["google-calendars"],
    queryFn: async () => {
      const res = await fetch("/api/google/calendar/list");
      if (!res.ok) return [];
      const data = await res.json();
      return data.calendars ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

// ── Selected calendar IDs (prefs) ──────────────────────────────────────────

export function useCalendarPrefs() {
  return useQuery<string[]>({
    queryKey: ["google-calendar-prefs"],
    queryFn: async () => {
      const res = await fetch("/api/google/calendar/prefs");
      if (!res.ok) return [];
      const data = await res.json();
      return data.calendar_ids ?? [];
    },
    staleTime: 60_000,
  });
}

export function useSaveCalendarPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (calendarIds: string[]) => {
      await fetch("/api/google/calendar/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendar_ids: calendarIds }),
      });
    },
    onSuccess: (_data, calendarIds) => {
      queryClient.setQueryData(["google-calendar-prefs"], calendarIds);
    },
  });
}

// ── Events ─────────────────────────────────────────────────────────────────

export function useGoogleCalendarEvents(
  calendarIds: string[],
  timeMin: string,
  timeMax: string
) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["google-calendar-events", calendarIds, timeMin, timeMax],
    queryFn: async () => {
      if (calendarIds.length === 0) return [];
      const params = new URLSearchParams({ timeMin, timeMax });
      calendarIds.forEach((id) => params.append("calendarId", id));
      const res = await fetch(`/api/google/calendar/events?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.events ?? [];
    },
    enabled: calendarIds.length > 0,
    staleTime: 2 * 60_000,
  });
}

// ── Shared with me ─────────────────────────────────────────────────────────

export function useSharedCalendars() {
  return useQuery<Calendar[]>({
    queryKey: ["shared-calendars"],
    queryFn: async () => {
      const res = await fetch("/api/google/calendar/shared-with-me");
      if (!res.ok) return [];
      const data = await res.json();
      return data.calendars ?? [];
    },
    staleTime: 60_000,
  });
}

// ── Calendar shares (owned by me) ──────────────────────────────────────────

export interface CalendarShare {
  id: string;
  calendar_id: string;
  calendar_name: string;
  calendar_color: string;
  shared_with: string;
}

export function useCalendarShares() {
  return useQuery<CalendarShare[]>({
    queryKey: ["calendar-shares"],
    queryFn: async () => {
      const res = await fetch("/api/google/calendar/share");
      if (!res.ok) return [];
      const data = await res.json();
      return data.shares ?? [];
    },
    staleTime: 30_000,
  });
}

export function useShareCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { calendar_id: string; calendar_name: string; calendar_color: string; shared_with_id: string }) => {
      const res = await fetch("/api/google/calendar/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error("Failed to share");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar-shares"] }),
  });
}

export function useUnshareCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { calendar_id: string; shared_with_id: string }) => {
      await fetch("/api/google/calendar/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar-shares"] }),
  });
}

// ── Disconnect ─────────────────────────────────────────────────────────────

export function useDisconnectGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/google/disconnect", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
      queryClient.removeQueries({ queryKey: ["google-calendars"] });
      queryClient.removeQueries({ queryKey: ["google-calendar-prefs"] });
      queryClient.removeQueries({ queryKey: ["google-calendar-events"] });
    },
  });
}
