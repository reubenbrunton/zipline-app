"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getMonthGrid, isToday, format } from "@/lib/calendar/utils";
import { useEvents } from "@/hooks/calendar";
import { EventChip } from "./EventChip";
import type { CalendarEvent } from "@/types/calendar";
import { parseISO } from "date-fns";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

interface MonthViewProps {
  currentDate: Date;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => {
    const dateStr = e.start.dateTime
      ? format(parseISO(e.start.dateTime), "yyyy-MM-dd")
      : e.start.date ?? "";
    return dateStr === format(day, "yyyy-MM-dd");
  });
}

export function MonthView({ currentDate, onDayClick, onEventClick }: MonthViewProps) {
  const { data: events = [], isLoading } = useEvents("month", currentDate);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const grid = getMonthGrid(year, month);

  return (
    <div className="bg-white/[0.09] backdrop-blur-xl border border-white/[0.12] rounded-xl overflow-hidden pb-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.1]">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "text-center text-xs font-semibold py-3 uppercase tracking-wider",
              i === 0 || i === 6 ? "text-[#A7A7C4]/75" : "text-[#B8B8D3]"
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {grid.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="border-r border-b border-white/[0.08] min-h-[120px]" />;
          }

          const dayKey = format(day, "yyyy-MM-dd");
          const dayEvents = getEventsForDay(events, day);
          const today = isToday(day);
          const isExpanded = expandedDay === dayKey;
          const overflow = dayEvents.length - MAX_VISIBLE;
          const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, MAX_VISIBLE);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={dayKey}
              onClick={() => onDayClick(day)}
              className={cn(
                "border-r border-b border-white/[0.08] min-h-[120px] p-1.5 cursor-pointer",
                "hover:bg-white/[0.11] transition-colors",
                isWeekend && "bg-white/[0.04]"
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium",
                    today
                      ? "bg-[#FF4533] text-white font-bold"
                      : isWeekend
                      ? "text-white/55"
                      : "text-white/85"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Events */}
              {isLoading ? (
                <div className="h-4 bg-white/[0.12] rounded animate-pulse w-3/4 mt-1" />
              ) : (
                <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                  {visibleEvents.map((event) => (
                    <EventChip key={event.id} event={event} onClick={onEventClick} />
                  ))}
                  {!isExpanded && overflow > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedDay(dayKey); }}
                      className="text-[10px] text-[#A7A7C4] hover:text-white px-1.5 py-0.5 rounded hover:bg-white/[0.1] transition-colors text-left"
                    >
                      +{overflow} more
                    </button>
                  )}
                  {isExpanded && overflow > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedDay(null); }}
                      className="text-[10px] text-[#A7A7C4] hover:text-white px-1.5 py-0.5 rounded hover:bg-white/[0.1] transition-colors text-left"
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
