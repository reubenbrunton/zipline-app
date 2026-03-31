import { Calendar, ExternalLink } from "lucide-react";
import { calendarEvents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const typeColors: Record<string, string> = {
  Call: "bg-indigo-500/20 text-indigo-400",
  Meeting: "bg-amber-500/20 text-amber-400",
  Internal: "bg-emerald-500/20 text-emerald-400",
};

export function CalendarWidget() {
  return (
    <div className="rounded-xl  bg-white/[0.07] backdrop-blur-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Upcoming Events</h3>
        <Calendar className="h-4 w-4 text-[#8888AA]" />
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {calendarEvents.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex-shrink-0 text-center bg-white/[0.06] rounded-lg px-2 py-1.5 min-w-[44px]">
              <p className="text-[10px] text-[#8888AA] font-medium uppercase leading-none">
                {event.date.split(" ")[0]}
              </p>
              <p className="text-sm font-bold text-white leading-tight mt-0.5">
                {event.date.split(" ")[1]}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {event.title}
              </p>
              <p className="text-[11px] text-[#8888AA] mt-0.5">{event.time}</p>
            </div>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeColors[event.type] ?? "bg-white/10 text-white/70"}`}
            >
              {event.type}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs gap-2"
        >
          <ExternalLink className="h-3 w-3" />
          Connect Google Calendar
        </Button>
      </div>
    </div>
  );
}
