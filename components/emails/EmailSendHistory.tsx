"use client";

import { useEmailSends } from "@/hooks/emails";
import { Clock } from "lucide-react";

export function EmailSendHistory() {
  const { data: sends = [], isLoading } = useEmailSends();

  if (isLoading || sends.length === 0) return null;

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="border-t border-white/[0.06] px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3.5 h-3.5 text-[#8888AA]" />
        <span className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider">Recent Sends</span>
      </div>
      <div className="space-y-1.5">
        {sends.map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-xs text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 flex-shrink-0" />
            <span className="text-white/70 truncate">{s.template_name ?? "Email"}</span>
            <span className="text-white/30">→</span>
            <span className="truncate">{s.to_email}</span>
            <span className="ml-auto flex-shrink-0 text-white/30">{timeAgo(s.sent_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
