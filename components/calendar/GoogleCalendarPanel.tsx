"use client";

import { useState } from "react";
import { MoreHorizontal, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGoogleCalendarStatus,
  useGoogleCalendars,
  useCalendarPrefs,
  useSaveCalendarPrefs,
  useDisconnectGoogle,
  useSharedCalendars,
  useCalendarShares,
  useShareCalendar,
  useUnshareCalendar,
} from "@/hooks/useGoogleCalendar";
import { useProfiles } from "@/hooks/tasks";
import { useQueryClient } from "@tanstack/react-query";
import type { Calendar } from "@/types/calendar";

// ── Share modal ──────────────────────────────────────────────────────────────

function ShareCalendarModal({
  calendar,
  onClose,
}: {
  calendar: Calendar;
  onClose: () => void;
}) {
  const { data: profiles = [] } = useProfiles();
  const { data: shares = [] } = useCalendarShares();
  const shareCalendar = useShareCalendar();
  const unshareCalendar = useUnshareCalendar();

  const sharedWithIds = shares
    .filter((s) => s.calendar_id === calendar.id)
    .map((s) => s.shared_with);

  function toggle(userId: string) {
    if (sharedWithIds.includes(userId)) {
      unshareCalendar.mutate({ calendar_id: calendar.id, shared_with_id: userId });
    } else {
      shareCalendar.mutate({
        calendar_id: calendar.id,
        calendar_name: calendar.name,
        calendar_color: calendar.color,
        shared_with_id: userId,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1A1A2E] border border-white/[0.1] rounded-2xl p-5 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Share calendar</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: calendar.color }} />
              <p className="text-xs text-[#8888AA] truncate">{calendar.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {profiles.length === 0 ? (
          <p className="text-xs text-[#8888AA]">No team members found.</p>
        ) : (
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {profiles.map((profile) => {
              const isShared = sharedWithIds.includes(profile.id);
              return (
                <li key={profile.id}>
                  <button
                    onClick={() => toggle(profile.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left",
                      isShared ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: "#FF4533" }}
                    >
                      {(profile.full_name ?? profile.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-xs">{profile.full_name ?? profile.email}</p>
                      <p className="truncate text-[10px] text-white/40">{profile.email}</p>
                    </div>
                    {isShared && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Calendar row with hover menu ─────────────────────────────────────────────

function CalendarRow({
  cal,
  active,
  onToggle,
  onShare,
}: {
  cal: Calendar;
  active: boolean;
  onToggle: () => void;
  onShare: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <li className="group relative">
      <div className={cn(
        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
        active ? "text-white" : "text-white/40 hover:text-white/70"
      )}>
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: active ? cal.color : "#555" }}
          />
          <span className="truncate">{cal.name}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.1] text-white/40 hover:text-white flex-shrink-0"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-7 z-20 bg-[#1A1A2E] border border-white/[0.1] rounded-xl shadow-2xl py-1 min-w-[130px]">
            <button
              onClick={() => { setMenuOpen(false); onShare(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </>
      )}
    </li>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function GoogleCalendarPanel() {
  const queryClient = useQueryClient();
  const { data: status, isLoading: statusLoading } = useGoogleCalendarStatus();
  const connected = status?.connected ?? false;

  const { data: calendars = [], isLoading: calsLoading } = useGoogleCalendars();
  const { data: selectedIds = [] } = useCalendarPrefs();
  const { data: sharedCalendars = [] } = useSharedCalendars();
  const savePrefs = useSaveCalendarPrefs();
  const disconnect = useDisconnectGoogle();

  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [sharingCalendar, setSharingCalendar] = useState<Calendar | null>(null);

  function toggleCalendar(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    savePrefs.mutate(next, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
    });
  }

  if (statusLoading) {
    return <div className="w-56 flex-shrink-0 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 animate-pulse" />;
  }

  return (
    <>
      <div className="w-56 flex-shrink-0 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-4 overflow-y-auto">
        <div>
          <p className="text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-2">
            Google Calendar
          </p>

          {!connected ? (
            <a
              href="/api/google/auth"
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-sm text-white font-medium transition-colors"
            >
              <GoogleIcon />
              Connect
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </div>
          )}
        </div>

        {connected && (
          <div>
            <p className="text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-2">
              My Calendars
            </p>

            {calsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-7 rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : calendars.length === 0 ? (
              <p className="text-xs text-[#8888AA]">No calendars found</p>
            ) : (
              <ul className="space-y-0.5">
                {calendars.map((cal) => (
                  <CalendarRow
                    key={cal.id}
                    cal={cal}
                    active={selectedIds.includes(cal.id)}
                    onToggle={() => toggleCalendar(cal.id)}
                    onShare={() => setSharingCalendar(cal)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Shared with me */}
        {sharedCalendars.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[#8888AA] uppercase tracking-wider mb-2">
              Shared With Me
            </p>
            <ul className="space-y-0.5">
              {sharedCalendars.map((cal) => (
                <li key={cal.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-white/70">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cal.color }} />
                  <span className="truncate">{cal.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {connected && (
          <div className="mt-auto pt-2 border-t border-white/[0.06]">
            {showConfirmDisconnect ? (
              <div className="space-y-2">
                <p className="text-xs text-white/60">Disconnect Google Calendar?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { disconnect.mutate(); setShowConfirmDisconnect(false); }}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowConfirmDisconnect(false)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDisconnect(true)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>

      {sharingCalendar && (
        <ShareCalendarModal
          calendar={sharingCalendar}
          onClose={() => setSharingCalendar(null)}
        />
      )}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
