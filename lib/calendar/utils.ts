import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  addMinutes,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  parseISO,
} from "date-fns";
import type { CalendarEvent } from "@/types/calendar";

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

/** Returns a flat array of Date | null for a 6-row month grid (42 cells). */
export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = endOfMonth(firstOfMonth);
  const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(lastOfMonth, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  // Pad to exactly 42 cells
  while (days.length < 42) days.push(null as unknown as Date);
  return days.map((d) => {
    if (!d) return null;
    const inMonth = d >= firstOfMonth && d <= lastOfMonth;
    return inMonth ? d : null;
  });
}

/** Returns 7 Date objects for the week containing the given date. */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: endOfWeek(date, { weekStartsOn: 0 }) });
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

export function getDayHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

/** Returns number of minutes from midnight for a given Date. */
export function dateToMinutes(date: Date): number {
  return getHours(date) * 60 + getMinutes(date);
}

/** Snaps a minutes value to the nearest 15-min slot. */
export function snapMinutes(minutes: number, interval = 15): number {
  return Math.round(minutes / interval) * interval;
}

/** Given a y offset inside a column and the slot height (px per 15min), returns minutes from midnight. */
export function yToMinutes(y: number, slotHeight: number): number {
  const raw = (y / slotHeight) * 15;
  return Math.max(0, Math.min(23 * 60 + 45, snapMinutes(raw)));
}

/** Build a Date from a base date (day) + minutes from midnight. */
export function minutesToDate(base: Date, minutes: number): Date {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return setMilliseconds(setSeconds(setMinutes(setHours(base, h), m), 0), 0);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatTime(date: Date): string {
  return format(date, "h:mm a").replace(":00", "").replace(" ", "");
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function formatDateRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    return `${format(start, "EEE, MMM d")} · ${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatShortDate(date: Date): string {
  return format(date, "EEE, MMM d");
}

// ---------------------------------------------------------------------------
// Event positioning in time grid
// ---------------------------------------------------------------------------

export const SLOT_HEIGHT = 15; // px per 15-minute slot
export const HOUR_HEIGHT = SLOT_HEIGHT * 4; // 60px per hour
export const DAY_HEIGHT = HOUR_HEIGHT * 24; // 1440px total

export function eventTop(event: CalendarEvent): number {
  const dt = event.start.dateTime ? parseISO(event.start.dateTime) : null;
  if (!dt) return 0;
  return (dateToMinutes(dt) / 60) * HOUR_HEIGHT;
}

export function eventHeight(event: CalendarEvent): number {
  const start = event.start.dateTime ? parseISO(event.start.dateTime) : null;
  const end = event.end.dateTime ? parseISO(event.end.dateTime) : null;
  if (!start || !end) return HOUR_HEIGHT;
  const durationMins = (end.getTime() - start.getTime()) / 60000;
  return Math.max(SLOT_HEIGHT, (durationMins / 60) * HOUR_HEIGHT);
}

// ---------------------------------------------------------------------------
// Re-export date-fns helpers used across components
// ---------------------------------------------------------------------------
export { isSameDay, isToday, format, addMinutes, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
