"use client";

import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/calendar/utils";
import type { CalendarEvent } from "@/types/calendar";
import { parseISO } from "date-fns";

interface EventChipProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
}

export function EventChip({ event, onClick }: EventChipProps) {
  const startTime = event.start.dateTime
    ? formatTime(parseISO(event.start.dateTime))
    : null;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={cn(
        "w-full text-left truncate text-[11px] font-medium px-1.5 py-0.5 rounded",
        "transition-opacity hover:opacity-80"
      )}
      style={{
        backgroundColor: `${event.color}33`,
        borderLeft: `2px solid ${event.color}`,
        color: event.color === "#8888AA" ? "#8888AA" : event.color,
      }}
    >
      {startTime && <span className="opacity-70 mr-1">{startTime}</span>}
      {event.title}
    </button>
  );
}
