"use client";

import { useEvents } from "@/hooks/calendar";
import { TimeGrid } from "./TimeGrid";
import type { CalendarEvent } from "@/types/calendar";

interface DayViewProps {
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onNewEvent?: (defaults?: Partial<CalendarEvent>) => void;
}

export function DayView({ currentDate, onEventClick, onNewEvent }: DayViewProps) {
  const { data: events = [] } = useEvents("day", currentDate);

  function handleDragCreate(start: Date, end: Date) {
    onNewEvent?.({
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      all_day: false,
    });
  }

  return (
    <TimeGrid
      days={[currentDate]}
      events={events}
      onEventClick={onEventClick}
      onDragCreate={handleDragCreate}
      showDayHeaders={false}
    />
  );
}
