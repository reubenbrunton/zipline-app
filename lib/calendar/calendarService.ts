// TODO: Connect to Google Calendar API
// Replace all functions below with real Google Calendar API calls.
// API reference: https://developers.google.com/calendar/api/v3/reference/events

import type { CalendarEvent, Calendar } from "@/types/calendar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// Seed calendars
// ---------------------------------------------------------------------------

const CALENDAR_PRIMARY = "cal-primary";
const CALENDAR_PERSONAL = "cal-personal";

const calendars: Calendar[] = [
  { id: CALENDAR_PRIMARY, name: "Zipline", color: "#FF4533", is_primary: true },
  { id: CALENDAR_PERSONAL, name: "Personal", color: "#6366F1", is_primary: false },
];

// ---------------------------------------------------------------------------
// Seed events — spread across March 2026 with rich variety
// ---------------------------------------------------------------------------

let events: CalendarEvent[] = [
  // --- All-day events ---
  {
    id: "evt-allday-1",
    title: "Agency Summit 2026",
    start: { date: "2026-03-16" },
    end: { date: "2026-03-18" },
    all_day: true,
    color: "#FF4533",
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-allday-2",
    title: "Q1 Review Week",
    start: { date: "2026-03-23" },
    end: { date: "2026-03-24" },
    all_day: true,
    color: "#F59E0B",
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },

  // --- This week (week of Mar 16) ---
  {
    id: "evt-1",
    title: "NovaTech Kickoff Call",
    start: { dateTime: "2026-03-17T09:00:00.000Z" },
    end: { dateTime: "2026-03-17T10:00:00.000Z" },
    all_day: false,
    color: "#FF4533",
    location: "Zoom",
    description: "Intro call with NovaTech team. Agenda: goals, timeline, deliverables.",
    calendar_id: CALENDAR_PRIMARY,
    attendees: [
      { email: "jordan@zipline.co", displayName: "Reuben Brunton" },
      { email: "ceo@novatech.io", displayName: "Sam Novak" },
    ],
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-2",
    title: "Brand Strategy Session",
    start: { dateTime: "2026-03-17T14:00:00.000Z" },
    end: { dateTime: "2026-03-17T16:00:00.000Z" },
    all_day: false,
    color: "#6366F1",
    location: "Conference Room A",
    calendar_id: CALENDAR_PRIMARY,
    attendees: [
      { email: "jordan@zipline.co", displayName: "Reuben Brunton" },
      { email: "taylor@zipline.co", displayName: "Taylor Brooks" },
      { email: "client@apexbrand.com", displayName: "Marcus Webb" },
    ],
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-3",
    title: "Weekly Team Standup",
    start: { dateTime: "2026-03-18T08:30:00.000Z" },
    end: { dateTime: "2026-03-18T09:00:00.000Z" },
    all_day: false,
    color: "#10B981",
    recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=TU,TH"],
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-4",
    title: "Deep Work — Apex Rebrand",
    start: { dateTime: "2026-03-18T10:00:00.000Z" },
    end: { dateTime: "2026-03-18T13:00:00.000Z" },
    all_day: false,
    color: "#10B981",
    description: "Focus block: design brand identity guidelines, no interruptions.",
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-5",
    title: "Apex Client Review",
    start: { dateTime: "2026-03-19T15:00:00.000Z" },
    end: { dateTime: "2026-03-19T16:00:00.000Z" },
    all_day: false,
    color: "#FF4533",
    location: "Google Meet",
    calendar_id: CALENDAR_PRIMARY,
    attendees: [{ email: "cmo@apexco.com", displayName: "Lisa Apex" }],
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-6",
    title: "Invoice Run",
    start: { dateTime: "2026-03-20T09:00:00.000Z" },
    end: { dateTime: "2026-03-20T09:30:00.000Z" },
    all_day: false,
    color: "#F59E0B",
    description: "Send March invoices to all active clients.",
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-7",
    title: "Content Planning — NovaTech",
    start: { dateTime: "2026-03-20T11:00:00.000Z" },
    end: { dateTime: "2026-03-20T12:30:00.000Z" },
    all_day: false,
    color: "#6366F1",
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },

  // --- Next week (Mar 23–27) ---
  {
    id: "evt-8",
    title: "Weekly Team Standup",
    start: { dateTime: "2026-03-24T08:30:00.000Z" },
    end: { dateTime: "2026-03-24T09:00:00.000Z" },
    all_day: false,
    color: "#10B981",
    recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=TU,TH"],
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-9",
    title: "Q1 Retrospective",
    start: { dateTime: "2026-03-24T14:00:00.000Z" },
    end: { dateTime: "2026-03-24T15:30:00.000Z" },
    all_day: false,
    color: "#F59E0B",
    location: "Main Office",
    calendar_id: CALENDAR_PRIMARY,
    attendees: [
      { email: "jordan@zipline.co", displayName: "Reuben Brunton" },
      { email: "riley@zipline.co", displayName: "Riley Chen" },
      { email: "taylor@zipline.co", displayName: "Taylor Brooks" },
    ],
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-10",
    title: "Proposal Review — Upwork",
    start: { dateTime: "2026-03-25T10:00:00.000Z" },
    end: { dateTime: "2026-03-25T11:00:00.000Z" },
    all_day: false,
    color: "#6366F1",
    calendar_id: CALENDAR_PRIMARY,
    status: "tentative",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-11",
    title: "Gym",
    start: { dateTime: "2026-03-25T07:00:00.000Z" },
    end: { dateTime: "2026-03-25T08:00:00.000Z" },
    all_day: false,
    color: "#8888AA",
    calendar_id: CALENDAR_PERSONAL,
    recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"],
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-12",
    title: "LinkedIn Content Batch",
    start: { dateTime: "2026-03-26T09:00:00.000Z" },
    end: { dateTime: "2026-03-26T12:00:00.000Z" },
    all_day: false,
    color: "#10B981",
    description: "Write 4 LinkedIn posts for April. Reference NovaTech brief.",
    calendar_id: CALENDAR_PRIMARY,
    status: "confirmed",
    created_at: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function getEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  // TODO: Connect to Google Calendar API
  // GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
  // params: timeMin, timeMax, singleEvents: true, orderBy: 'startTime'
  const filtered = events.filter((e) => {
    const eventStart = e.start.dateTime
      ? new Date(e.start.dateTime)
      : e.start.date
      ? new Date(e.start.date)
      : null;
    const eventEnd = e.end.dateTime
      ? new Date(e.end.dateTime)
      : e.end.date
      ? new Date(e.end.date)
      : null;
    if (!eventStart || !eventEnd) return false;
    return eventStart < end && eventEnd > start;
  });
  return delay(filtered);
}

export async function createEvent(
  data: Omit<CalendarEvent, "id" | "created_at">
): Promise<CalendarEvent> {
  // TODO: Connect to Google Calendar API
  // POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
  const event: CalendarEvent = {
    ...data,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  events = [...events, event];
  return delay(event);
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<CalendarEvent, "id" | "created_at">>
): Promise<CalendarEvent> {
  // TODO: Connect to Google Calendar API
  // PATCH https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
  events = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
  const found = events.find((e) => e.id === id)!;
  return delay(found);
}

export async function deleteEvent(id: string): Promise<void> {
  // TODO: Connect to Google Calendar API
  // DELETE https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
  events = events.filter((e) => e.id !== id);
  return delay(undefined);
}

export async function getCalendars(): Promise<Calendar[]> {
  // TODO: Connect to Google Calendar API
  // GET https://www.googleapis.com/calendar/v3/users/me/calendarList
  return delay(calendars);
}
