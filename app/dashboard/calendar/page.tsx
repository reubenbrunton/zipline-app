"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addYears, subYears,
  addMonths, subMonths,
  addWeeks, subWeeks,
  addDays, subDays,
} from "date-fns";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { YearView } from "@/components/calendar/YearView";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import type { CalendarView, CalendarEvent } from "@/types/calendar";

const variants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 2, 17)); // March 17 2026
  const [direction, setDirection] = useState<1 | -1>(1);

  // Event detail modal
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  function navigate(dir: 1 | -1) {
    setDirection(dir);
    setCurrentDate((prev) => {
      switch (view) {
        case "year":   return dir === 1 ? addYears(prev, 1)  : subYears(prev, 1);
        case "month":  return dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1);
        case "week":   return dir === 1 ? addWeeks(prev, 1)  : subWeeks(prev, 1);
        case "day":    return dir === 1 ? addDays(prev, 1)   : subDays(prev, 1);
      }
    });
  }

  const handleViewChange = useCallback((newView: CalendarView) => {
    setDirection(1);
    setView(newView);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setDirection(1);
    setCurrentDate(date);
    setView("day");
  }, []);

  const handleMonthClick = useCallback((date: Date) => {
    setDirection(1);
    setCurrentDate(date);
    setView("month");
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setDetailEvent(event);
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <CalendarHeader
        view={view}
        currentDate={currentDate}
        onViewChange={handleViewChange}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={() => { setDirection(1); setCurrentDate(new Date(2026, 2, 17)); }}
      />

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${view}-${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.9 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {view === "year" && (
              <YearView
                currentDate={currentDate}
                onDayClick={handleDayClick}
                onMonthClick={handleMonthClick}
              />
            )}
            {view === "month" && (
              <MonthView
                currentDate={currentDate}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
              />
            )}
            {view === "week" && (
              <WeekView
                currentDate={currentDate}
                onEventClick={handleEventClick}
                onDayClick={handleDayClick}
              />
            )}
            {view === "day" && (
              <DayView
                currentDate={currentDate}
                onEventClick={handleEventClick}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          open={!!detailEvent}
          onClose={() => setDetailEvent(null)}
        />
      )}
    </div>
  );
}
