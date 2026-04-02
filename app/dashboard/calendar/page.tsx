"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addYears, subYears,
  addMonths, subMonths,
  addWeeks, subWeeks,
  addDays, subDays,
} from "date-fns";
import { useSearchParams } from "next/navigation";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { YearView } from "@/components/calendar/YearView";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { GoogleCalendarPanel } from "@/components/calendar/GoogleCalendarPanel";
import type { CalendarView, CalendarEvent } from "@/types/calendar";

const variants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarPageInner />
    </Suspense>
  );
}

function CalendarPageInner() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [direction, setDirection] = useState<1 | -1>(1);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  const searchParams = useSearchParams();
  const [banner, setBanner] = useState<"connected" | "error" | null>(null);

  useEffect(() => {
    if (searchParams.get("connected") === "true") setBanner("connected");
    else if (searchParams.get("error")) setBanner(searchParams.get("error") as "error");
  }, [searchParams]);

  function navigate(dir: 1 | -1) {
    setDirection(dir);
    setCurrentDate((prev) => {
      switch (view) {
        case "year":  return dir === 1 ? addYears(prev, 1)  : subYears(prev, 1);
        case "month": return dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1);
        case "week":  return dir === 1 ? addWeeks(prev, 1)  : subWeeks(prev, 1);
        case "day":   return dir === 1 ? addDays(prev, 1)   : subDays(prev, 1);
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
      {/* Success/error banner */}
      {banner && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
          banner === "connected"
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/15 text-red-400 border border-red-500/20"
        }`}>
          {banner === "connected"
            ? "Google Calendar connected successfully."
            : `Failed to connect Google Calendar: ${banner}`}
          <button onClick={() => setBanner(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main calendar */}
        <div className="flex flex-col flex-1 min-w-0 gap-4">
          <CalendarHeader
            view={view}
            currentDate={currentDate}
            onViewChange={handleViewChange}
            onPrev={() => navigate(-1)}
            onNext={() => navigate(1)}
            onToday={() => { setDirection(1); setCurrentDate(new Date()); }}
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
        </div>

        {/* Google Calendar sidebar */}
        <GoogleCalendarPanel />
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
