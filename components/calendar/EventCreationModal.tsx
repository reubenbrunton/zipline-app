"use client";

import { useState, useEffect } from "react";
import { MapPin, Users, Repeat, Video, Bell, Calendar, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCreateEvent, useUpdateEvent } from "@/hooks/calendar";
import type { CalendarEvent } from "@/types/calendar";

const COLORS = [
  { label: "Red", value: "#FF4533" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Green", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Sky", value: "#38BDF8" },
  { label: "Pink", value: "#EC4899" },
];

const CALENDARS = [
  { id: "cal-primary", name: "Zipline" },
  { id: "cal-personal", name: "Personal" },
];

interface EventCreationModalProps {
  open: boolean;
  onClose: () => void;
  defaults?: Partial<CalendarEvent>;
}

function toDateInput(iso?: string): string {
  if (!iso) return format(new Date(), "yyyy-MM-dd");
  return format(parseISO(iso), "yyyy-MM-dd");
}

function toTimeInput(iso?: string, fallback = "09:00"): string {
  if (!iso) return fallback;
  return format(parseISO(iso), "HH:mm");
}

export function EventCreationModal({ open, onClose, defaults }: EventCreationModalProps) {
  const isEditing = !!(defaults?.id);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [date, setDate] = useState(format(new Date(2026, 2, 17), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [calendarId, setCalendarId] = useState("cal-primary");

  // Pre-fill when defaults change
  useEffect(() => {
    if (!open) return;
    setTitle(defaults?.title ?? "");
    setAllDay(defaults?.all_day ?? false);
    setDate(toDateInput(defaults?.start?.dateTime ?? defaults?.start?.date));
    setStartTime(toTimeInput(defaults?.start?.dateTime, "09:00"));
    setEndTime(toTimeInput(defaults?.end?.dateTime, "10:00"));
    setLocation(defaults?.location ?? "");
    setDescription(defaults?.description ?? "");
    setColor(defaults?.color ?? "#6366F1");
    setCalendarId(defaults?.calendar_id ?? "cal-primary");
  }, [open, defaults]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = allDay
      ? undefined
      : new Date(`${date}T${startTime}:00.000Z`).toISOString();
    const endISO = allDay
      ? undefined
      : new Date(`${date}T${endTime}:00.000Z`).toISOString();

    const payload = {
      title: title.trim(),
      all_day: allDay,
      start: allDay ? { date } : { dateTime: startISO! },
      end: allDay ? { date } : { dateTime: endISO! },
      color,
      location: location || undefined,
      description: description || undefined,
      calendar_id: calendarId,
      status: "confirmed" as const,
    };

    if (isEditing && defaults?.id) {
      updateEvent.mutate({ id: defaults.id, patch: payload });
    } else {
      createEvent.mutate(payload);
    }
    onClose();
  }

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        size="lg"
        className="max-h-[90vh] overflow-y-auto bg-white/[0.14] border-white/[0.2]"
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <input
            autoFocus
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-white/[0.22] pb-2 text-lg font-semibold text-white placeholder:text-[#B8B8D3]/60 focus:outline-none focus:border-white/45 transition-colors"
          />

          {/* Color picker */}
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={cn(
                  "w-5 h-5 rounded-full transition-transform",
                  color === c.value && "ring-2 ring-white ring-offset-1 ring-offset-[#16161F] scale-110"
                )}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>

          {/* All-day toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={allDay}
              onClick={() => setAllDay(!allDay)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative",
                allDay ? "bg-[#FF4533]" : "bg-white/[0.2]"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  allDay && "translate-x-4"
                )}
              />
            </button>
            <span className="text-sm text-[#8888AA]">All day</span>
          </label>

          {/* Date + time */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/[0.12] border border-white/[0.18] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/35 [color-scheme:dark]"
            />
            {!allDay && (
              <>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-white/[0.12] border border-white/[0.18] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/35 [color-scheme:dark]"
                />
                <span className="text-[#8888AA] text-sm">–</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-white/[0.12] border border-white/[0.18] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/35 [color-scheme:dark]"
                />
              </>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-[#8888AA] flex-shrink-0" />
            <input
              type="text"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[#8888AA]/50 focus:outline-none"
            />
          </div>

          {/* Description */}
          <textarea
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.1] border border-white/[0.14] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#B8B8D3]/60 focus:outline-none focus:border-white/[0.28] resize-none transition-colors"
          />

          {/* Calendar selector */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-[#8888AA] flex-shrink-0" />
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="flex-1 bg-white/[0.1] border border-white/[0.14] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none [color-scheme:dark]"
            >
              {CALENDARS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Stubs */}
          <div className="flex flex-col gap-2 border-t border-white/[0.12] pt-4">
            {/* Guests */}
            <div className="flex items-center gap-3 text-sm text-[#8888AA]/50 cursor-not-allowed">
              <Users className="h-4 w-4" />
              <span>Add guests</span>
              <span className="ml-auto text-[10px] bg-white/[0.1] px-1.5 py-0.5 rounded">TODO: GCal API</span>
            </div>
            {/* Recurrence */}
            <div className="flex items-center gap-3 text-sm text-[#8888AA]/50 cursor-not-allowed">
              <Repeat className="h-4 w-4" />
              <span>Does not repeat</span>
              <span className="ml-auto text-[10px] bg-white/[0.1] px-1.5 py-0.5 rounded">TODO: GCal API</span>
            </div>
            {/* Video call */}
            <div className="flex items-center gap-3 text-sm text-[#8888AA]/50 cursor-not-allowed">
              <Video className="h-4 w-4" />
              <span>Add video call</span>
              <span className="ml-auto text-[10px] bg-white/[0.1] px-1.5 py-0.5 rounded">TODO: Google Meet</span>
            </div>
            {/* Reminder */}
            <div className="flex items-center gap-3 text-sm text-[#8888AA]/50 cursor-not-allowed">
              <Bell className="h-4 w-4" />
              <span>15 min reminder</span>
              <span className="ml-auto text-[10px] bg-white/[0.1] px-1.5 py-0.5 rounded">TODO: GCal API</span>
            </div>
          </div>
        </form>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#B8B8D3] hover:text-white hover:bg-white/[0.12] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4533] hover:bg-[#e03d2d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save changes" : "Create event"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
