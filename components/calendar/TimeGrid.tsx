"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatHour, HOUR_HEIGHT, DAY_HEIGHT, getDayHours, isSameDay, isToday, yToMinutes, minutesToDate, format } from "@/lib/calendar/utils";
import { EventBlock } from "./EventBlock";
import type { CalendarEvent, DragCreateState } from "@/types/calendar";
import { parseISO } from "date-fns";

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDragCreate: (start: Date, end: Date) => void;
  onDayHeaderClick?: (date: Date) => void;
  showDayHeaders?: boolean;
}

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => {
    if (e.all_day) return false;
    const dt = e.start.dateTime ? parseISO(e.start.dateTime) : null;
    return dt ? isSameDay(dt, day) : false;
  });
}

function getAllDayEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => {
    if (!e.all_day) return false;
    const startDate = e.start.date ? new Date(e.start.date + "T00:00:00") : null;
    const endDate = e.end.date ? new Date(e.end.date + "T00:00:00") : null;
    if (!startDate) return false;
    if (!endDate) return isSameDay(startDate, day);
    return day >= startDate && day < endDate;
  });
}

function CurrentTimeLine() {
  const [top, setTop] = useState(0);

  useEffect(() => {
    function update() {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setTop((minutes / 60) * HOUR_HEIGHT);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="w-2 h-2 rounded-full bg-[#FF4533] -ml-1 flex-shrink-0" />
      <div className="flex-1 h-px bg-[#FF4533]" />
    </div>
  );
}

export function TimeGrid({
  days,
  events,
  onEventClick,
  onDragCreate,
  onDayHeaderClick,
  showDayHeaders = true,
}: TimeGridProps) {
  const hours = getDayHours();
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragCreateState | null>(null);
  const dragRef = useRef<DragCreateState | null>(null);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = HOUR_HEIGHT * 7.5;
    }
  }, []);

  function getSlotHeight() {
    return HOUR_HEIGHT / 4; // 15px per 15-min slot
  }

  function pointerToMinutes(e: React.PointerEvent, col: HTMLElement): number {
    const rect = col.getBoundingClientRect();
    const scrollTop = gridRef.current?.scrollTop ?? 0;
    const y = e.clientY - rect.top + scrollTop;
    return yToMinutes(y, getSlotHeight());
  }

  function handlePointerDown(e: React.PointerEvent, day: Date) {
    if (e.button !== 0) return;
    const col = e.currentTarget as HTMLElement;
    const mins = pointerToMinutes(e, col);
    const state: DragCreateState = {
      active: true,
      columnDate: day,
      startMinutes: mins,
      endMinutes: mins + 60,
    };
    dragRef.current = state;
    setDrag(state);
    col.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent, day: Date) {
    if (!dragRef.current || !isSameDay(dragRef.current.columnDate, day)) return;
    const col = e.currentTarget as HTMLElement;
    const mins = pointerToMinutes(e, col);
    const updated: DragCreateState = {
      ...dragRef.current,
      endMinutes: Math.max(mins, dragRef.current.startMinutes + 15),
    };
    dragRef.current = updated;
    setDrag(updated);
  }

  function handlePointerUp(e: React.PointerEvent, day: Date) {
    if (!dragRef.current || !isSameDay(dragRef.current.columnDate, day)) return;
    const { startMinutes, endMinutes, columnDate } = dragRef.current;
    if (Math.abs(endMinutes - startMinutes) >= 15) {
      const start = minutesToDate(columnDate, startMinutes);
      const end = minutesToDate(columnDate, endMinutes);
      onDragCreate(start, end);
    }
    dragRef.current = null;
    setDrag(null);
  }

  // All-day events
  const allDayByDay = days.map((day) => getAllDayEventsForDay(events, day));
  const hasAllDay = allDayByDay.some((d) => d.length > 0);

  return (
    <div className="flex flex-col bg-white/[0.09] backdrop-blur-xl border border-white/[0.12] rounded-xl overflow-hidden">
      {/* Day column headers */}
      {showDayHeaders && (
        <div className="flex border-b border-white/[0.1] flex-shrink-0">
          {/* Gutter spacer */}
          <div className="w-14 flex-shrink-0 border-r border-white/[0.1]" />
          {days.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className="flex-1 text-center py-2 border-r border-white/[0.08] last:border-r-0 cursor-pointer hover:bg-white/[0.1] transition-colors"
                onClick={() => onDayHeaderClick?.(day)}
              >
                <p className="text-[10px] text-[#B8B8D3] uppercase tracking-wider font-medium">
                  {format(day, "EEE")}
                </p>
                <span
                  className={cn(
                    "text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full mt-0.5",
                    today ? "bg-[#FF4533] text-white" : "text-white/80"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* All-day events row */}
      {hasAllDay && (
        <div className="flex border-b border-white/[0.1] flex-shrink-0 min-h-[32px]">
          <div className="w-14 flex-shrink-0 border-r border-white/[0.1] flex items-center justify-end pr-2">
            <span className="text-[9px] text-[#B8B8D3] uppercase tracking-wider">All day</span>
          </div>
          {days.map((day) => {
            const dayAllDay = getAllDayEventsForDay(events, day);
            return (
              <div key={format(day, "yyyy-MM-dd")} className="flex-1 border-r border-white/[0.08] last:border-r-0 p-0.5 flex flex-col gap-0.5">
                {dayAllDay.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onEventClick(e)}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate text-left w-full"
                    style={{ backgroundColor: `${e.color}30`, color: e.color }}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={gridRef} className="overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 280px)" }}>
        <div className="flex" style={{ height: `${DAY_HEIGHT}px` }}>
          {/* Time labels gutter */}
          <div className="w-14 flex-shrink-0 relative border-r border-white/[0.1]">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-[#B8B8D3]"
                style={{ top: `${h * HOUR_HEIGHT - 6}px` }}
              >
                {h === 0 ? "" : formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(events, day);
            const today = isToday(day);
            const isDragCol = drag && isSameDay(drag.columnDate, day);
            const dragTop = isDragCol ? (Math.min(drag.startMinutes, drag.endMinutes) / 60) * HOUR_HEIGHT : 0;
            const dragHeight = isDragCol ? (Math.abs(drag.endMinutes - drag.startMinutes) / 60) * HOUR_HEIGHT : 0;

            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={cn(
                  "flex-1 relative border-r border-white/[0.08] last:border-r-0 select-none",
                  today && "bg-[#FF4533]/[0.04]"
                )}
                onPointerDown={(e) => handlePointerDown(e, day)}
                onPointerMove={(e) => handlePointerMove(e, day)}
                onPointerUp={(e) => handlePointerUp(e, day)}
              >
                {/* Hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-white/[0.08]"
                    style={{ top: `${h * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Half-hour lines */}
                {hours.map((h) => (
                  <div
                    key={`half-${h}`}
                    className="absolute left-0 right-0 border-t border-white/[0.05]"
                    style={{ top: `${h * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                  />
                ))}

                {/* Current time line (only in today's column) */}
                {today && <CurrentTimeLine />}

                {/* Drag-to-create overlay */}
                {isDragCol && dragHeight > 0 && (
                  <div
                    className="absolute left-1 right-1 rounded-lg pointer-events-none z-30"
                    style={{
                      top: `${dragTop}px`,
                      height: `${dragHeight}px`,
                      backgroundColor: "#6366F130",
                      border: "2px solid #6366F1",
                    }}
                  />
                )}

                {/* Events */}
                {dayEvents.map((event) => (
                  <EventBlock key={event.id} event={event} onClick={onEventClick} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
