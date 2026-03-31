"use client";

import { MapPin, Clock, Calendar, Users, Repeat } from "lucide-react";
import { parseISO, format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatDateRange } from "@/lib/calendar/utils";
import type { CalendarEvent } from "@/types/calendar";

const CALENDAR_NAMES: Record<string, string> = {
  "cal-primary": "Zipline",
  "cal-personal": "Personal",
};

interface EventDetailModalProps {
  event: CalendarEvent;
  open: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, open, onClose }: EventDetailModalProps) {
  const startDate = event.start.dateTime ? parseISO(event.start.dateTime) : null;
  const endDate = event.end.dateTime ? parseISO(event.end.dateTime) : null;
  const dateRange = startDate && endDate
    ? formatDateRange(startDate, endDate)
    : event.start.date
    ? format(new Date(event.start.date + "T00:00:00"), "EEEE, MMMM d, yyyy")
    : "";

  const calendarName = CALENDAR_NAMES[event.calendar_id] ?? event.calendar_id;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white/[0.14] backdrop-blur-2xl border-white/[0.2]">
        {/* Color stripe header */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ backgroundColor: event.color }}
        />

        <DialogHeader className="mt-2">
          <div className="flex items-start justify-between gap-2 pr-8">
            <DialogTitle className="text-lg leading-tight">{event.title}</DialogTitle>
            {event.status === "tentative" && (
              <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Tentative
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          {/* Date / time */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-[#8888AA] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white">{dateRange}</p>
              {event.all_day && (
                <p className="text-xs text-[#8888AA] mt-0.5">All day</p>
              )}
              {event.recurrence && event.recurrence.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Repeat className="h-3 w-3 text-[#8888AA]" />
                  <p className="text-xs text-[#8888AA]">Recurring event</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#8888AA] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white">{event.location}</p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-[#8888AA] flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                {event.attendees.map((a) => (
                  <p key={a.email} className="text-sm text-white">
                    {a.displayName ?? a.email}
                    <span className="text-[#8888AA] ml-1 text-xs">{a.email}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="bg-white/[0.09] rounded-lg px-3 py-2.5">
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Calendar */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-[#8888AA] flex-shrink-0" />
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: event.color }} />
              <p className="text-sm text-[#8888AA]">{calendarName}</p>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
