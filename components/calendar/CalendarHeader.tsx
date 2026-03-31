"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMonthYear, format } from "@/lib/calendar/utils";
import type { CalendarView } from "@/types/calendar";

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
];

interface CalendarHeaderProps {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function getLabel(view: CalendarView, date: Date): string {
  switch (view) {
    case "year":
      return format(date, "yyyy");
    case "month":
      return formatMonthYear(date);
    case "week": {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
      }
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    case "day":
      return format(date, "EEE, MMM d, yyyy");
  }
}

export function CalendarHeader({
  view,
  currentDate,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Left: nav + title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.09] hover:bg-white/[0.14] text-[#A7A7C4] hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.09] hover:bg-white/[0.14] text-[#A7A7C4] hover:text-white transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-bold text-white ml-1 min-w-[200px]">
          {getLabel(view, currentDate)}
        </h2>
      </div>

      {/* Right: view switcher + Today */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white/[0.09] rounded-lg p-0.5 gap-0.5 border border-white/[0.1]">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                view === key
                  ? "bg-white/[0.16] text-white shadow-sm"
                  : "text-[#A7A7C4] hover:text-white hover:bg-white/[0.1]"
              )}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 bg-white/[0.16] mx-0.5" />
          <button
            onClick={onToday}
            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors text-[#A7A7C4] hover:text-white hover:bg-white/[0.1]"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}
