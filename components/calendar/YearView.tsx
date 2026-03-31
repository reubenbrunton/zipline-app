"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getMonthGrid, isToday, format } from "@/lib/calendar/utils";
import { useEvents } from "@/hooks/calendar";
import type { CalendarEvent } from "@/types/calendar";
import { parseISO } from "date-fns";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["S","M","T","W","T","F","S"];

interface YearViewProps {
  currentDate: Date;
  onDayClick: (date: Date) => void;
  onMonthClick: (date: Date) => void;
}

function eventDaySet(events: CalendarEvent[]): Map<string, string> {
  const map = new Map<string, string>();
  events.forEach((e) => {
    const dateStr = e.start.dateTime
      ? format(parseISO(e.start.dateTime), "yyyy-MM-dd")
      : e.start.date ?? "";
    if (dateStr && !map.has(dateStr)) map.set(dateStr, e.color);
  });
  return map;
}

function MiniMonth({
  year,
  monthIndex,
  eventMap,
  onDayClick,
  onMonthClick,
}: {
  year: number;
  monthIndex: number;
  eventMap: Map<string, string>;
  onDayClick: (d: Date) => void;
  onMonthClick: (d: Date) => void;
}) {
  const grid = getMonthGrid(year, monthIndex);
  const firstOfMonth = new Date(year, monthIndex, 1);

  return (
    <div className="bg-white/[0.09] backdrop-blur-xl border border-white/[0.12] rounded-xl p-4 hover:bg-white/[0.12] transition-colors">
      {/* Month header */}
      <button
        onClick={() => onMonthClick(firstOfMonth)}
        className="text-sm font-semibold text-white hover:text-[#FF4533] transition-colors mb-3 block w-full text-left"
      >
        {MONTHS[monthIndex]}
      </button>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-[#B8B8D3] font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = format(day, "yyyy-MM-dd");
          const dotColor = eventMap.get(key);
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className={cn(
                "relative flex flex-col items-center justify-center w-6 h-6 mx-auto rounded-full text-[11px] transition-colors",
                today
                  ? "bg-[#FF4533] text-white font-bold"
                  : "text-white/82 hover:bg-white/[0.14] hover:text-white"
              )}
            >
              {day.getDate()}
              {dotColor && !today && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YearView({ currentDate, onDayClick, onMonthClick }: YearViewProps) {
  const year = currentDate.getFullYear();
  const { data: events = [] } = useEvents("year", currentDate);
  const eventMap = useMemo(() => eventDaySet(events), [events]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
      {MONTHS.map((_, i) => (
        <MiniMonth
          key={i}
          year={year}
          monthIndex={i}
          eventMap={eventMap}
          onDayClick={onDayClick}
          onMonthClick={onMonthClick}
        />
      ))}
    </div>
  );
}
