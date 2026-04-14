"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Mail, Send, Users, LayoutTemplate, Eye } from "lucide-react";
import { useEmailSends } from "@/hooks/emails";
import { useProfiles } from "@/hooks/tasks/useProfiles";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface Props {
  onCompose: () => void;
}

export function EmailDashboard({ onCompose }: Props) {
  const { data: sends = [], isLoading } = useEmailSends();
  const { data: profiles = [] } = useProfiles();
  const [sortDesc, setSortDesc] = useState(true);

  const profileMap = useMemo(() => {
    return Object.fromEntries(profiles.map((p) => [p.id, p]));
  }, [profiles]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = useMemo(() => {
    const thisMonth = sends.filter((s) => new Date(s.sent_at) >= startOfMonth);
    const uniqueClients = new Set(sends.map((s) => s.to_email)).size;
    const uniqueTemplates = new Set(sends.filter((s) => s.template_name).map((s) => s.template_name)).size;
    const opened = sends.filter((s) => s.opened_at).length;
    const openRate = sends.length > 0 ? Math.round((opened / sends.length) * 100) : 0;
    return {
      thisMonth: thisMonth.length,
      total: sends.length,
      uniqueClients,
      uniqueTemplates,
      opened,
      openRate,
    };
  }, [sends]);

  const sortedSends = useMemo(() => {
    return [...sends].sort((a, b) => {
      const diff = new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
      return sortDesc ? -diff : diff;
    });
  }, [sends, sortDesc]);

  const statCards = [
    { label: "Sent this month", value: stats.thisMonth, icon: Send, color: "text-[#FF4533]" },
    { label: "Total sent", value: stats.total, icon: Mail, color: "text-blue-400" },
    { label: "Open rate", value: `${stats.openRate}%`, icon: Eye, color: "text-emerald-400" },
    { label: "Templates used", value: stats.uniqueTemplates, icon: LayoutTemplate, color: "text-purple-400" },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#8888AA] font-medium">{card.label}</p>
                <Icon className={`w-4 h-4 ${card.color} opacity-60`} />
              </div>
              <p className="text-2xl font-bold text-white">
                {isLoading ? <span className="inline-block w-8 h-6 rounded bg-white/[0.06] animate-pulse" /> : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Send button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Send History</h2>
        <button
          onClick={onCompose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF4533] hover:bg-[#e03d2d] text-white text-sm font-semibold transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Send Email
        </button>
      </div>

      {/* History table */}
      <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : sends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No emails sent yet</p>
            <p className="text-xs text-white/20 mt-1">Hit "Send Email" to get started</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white/[0.04] backdrop-blur-sm">
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8888AA] uppercase tracking-wider">Template</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8888AA] uppercase tracking-wider">Recipient</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8888AA] uppercase tracking-wider hidden md:table-cell">Sent by</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8888AA] uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => setSortDesc((d) => !d)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors group"
                    >
                      Time
                      {sortDesc ? (
                        <ArrowDown className="w-3 h-3 text-[#FF4533]" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-[#FF4533]" />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8888AA] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedSends.map((send, i) => {
                  const sender = send.sent_by ? profileMap[send.sent_by] : null;
                  return (
                    <tr
                      key={send.id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === sortedSends.length - 1 ? "border-0" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-white font-medium">{send.template_name ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          {send.to_name && (
                            <p className="text-white text-xs font-medium">{send.to_name}</p>
                          )}
                          <p className="text-[#8888AA] text-xs">{send.to_email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {sender ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#FF4533]/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-[#FF4533]">
                                {(sender.full_name ?? sender.email ?? "?").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-white/70">{sender.full_name ?? sender.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div>
                          <p className="text-xs text-white/60">{formatDate(send.sent_at)}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(send.sent_at)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {send.opened_at ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium">
                              <Eye className="w-3 h-3" />
                              Opened
                              {send.open_count > 1 && <span className="text-blue-400/60">×{send.open_count}</span>}
                            </span>
                            <span className="text-[10px] text-white/30 pl-1">{timeAgo(send.opened_at)}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Sent
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
