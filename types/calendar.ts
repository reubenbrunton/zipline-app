export type CalendarView = "year" | "month" | "week" | "day";

export interface CalendarEventDateTime {
  dateTime?: string; // ISO 8601 — for timed events
  date?: string;     // YYYY-MM-DD — for all-day events
  timeZone?: string;
}

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: "needsAction" | "accepted" | "declined" | "tentative";
}

export interface CalendarEvent {
  id: string;
  title: string;          // GCal: "summary"
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  all_day: boolean;
  color: string;          // hex — mapped from GCal "colorId"
  location?: string;
  description?: string;
  calendar_id: string;
  recurrence?: string[];  // ["RRULE:FREQ=WEEKLY;BYDAY=MO"] stub
  attendees?: CalendarAttendee[];  // stub
  conference_data?: null; // Google Meet stub
  reminder_minutes?: number; // stub
  status: "confirmed" | "tentative" | "cancelled";
  created_at: string;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  is_primary: boolean;
}

export interface DragCreateState {
  active: boolean;
  columnDate: Date;
  startMinutes: number;
  endMinutes: number;
}
