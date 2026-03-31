"use client";

import { cn } from "@/lib/utils";
import { formatTime, eventTop, eventHeight } from "@/lib/calendar/utils";
import type { CalendarEvent } from "@/types/calendar";
import { parseISO } from "date-fns";

interface EventBlockProps {
  event: CalendarEvent;
  columnIndex?: number;
  totalColumns?: number;
  onClick: (event: CalendarEvent) => void;
}

export function EventBlock({ event, columnIndex = 0, totalColumns = 1, onClick }: EventBlockProps) {
  const top = eventTop(event);
  const height = eventHeight(event);
  const isShort = height < 40;

  const startTime = event.start.dateTime ? formatTime(parseISO(event.start.dateTime)) : null;
  const endTime = event.end.dateTime ? formatTime(parseISO(event.end.dateTime)) : null;

  const widthPct = 100 / totalColumns;
  const leftPct = columnIndex * widthPct;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={cn(
        "absolute rounded-r-lg px-2 py-1 text-left overflow-hidden",
        "hover:brightness-110 transition-all duration-150 cursor-pointer group",
        event.status === "tentative" && "opacity-70 border-dashed"
      )}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 20)}px`,
        left: `${leftPct + 1}%`,
        width: `${widthPct - 2}%`,
        backgroundColor: `${event.color}36`,
        borderLeft: `3px solid ${event.color}`,
        zIndex: 10,
      }}
      title={event.title}
    >
      <p
        className={cn(
          "font-medium leading-tight truncate",
          isShort ? "text-[10px]" : "text-xs"
        )}
        style={{ color: event.color }}
      >
        {event.title}
      </p>
      {!isShort && startTime && endTime && (
        <p className="text-[10px] opacity-70 truncate" style={{ color: event.color }}>
          {startTime} – {endTime}
        </p>
      )}
      {!isShort && event.location && (
        <p className="text-[10px] opacity-50 truncate mt-0.5" style={{ color: event.color }}>
          {event.location}
        </p>
      )}
    </button>
  );
}
