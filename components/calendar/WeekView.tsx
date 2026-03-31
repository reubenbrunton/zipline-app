"use client";

import { getWeekDays, format } from "@/lib/calendar/utils";
import { useEvents } from "@/hooks/calendar";
import { TimeGrid } from "./TimeGrid";
import type { CalendarEvent } from "@/types/calendar";

interface WeekViewProps {
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onNewEvent?: (defaults?: Partial<CalendarEvent>) => void;
  onDayClick: (date: Date) => void;
}

export function WeekView({ currentDate, onEventClick, onNewEvent, onDayClick }: WeekViewProps) {
  const { data: events = [], isLoading } = useEvents("week", currentDate);
  const days = getWeekDays(currentDate);

  function handleDragCreate(start: Date, end: Date) {
    onNewEvent?.({
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      all_day: false,
    });
  }

  return (
    <TimeGrid
      days={days}
      events={events}
      onEventClick={onEventClick}
      onDragCreate={handleDragCreate}
      onDayHeaderClick={onDayClick}
      showDayHeaders
    />
  );
}
