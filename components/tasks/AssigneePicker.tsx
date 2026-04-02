"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/hooks/tasks";
import { AssigneeAvatar } from "./AssigneeAvatar";

interface AssigneePickerProps {
  value?: string;
  onChange: (value?: string) => void;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  label?: string;
  compact?: boolean;
  multiple?: boolean;
}

export function AssigneePicker({
  value,
  onChange,
  values,
  onValuesChange,
  label = "Assignee",
  compact = false,
  multiple = false,
}: AssigneePickerProps) {
  const { data: profiles = [], isLoading } = useProfiles();
  const [localValues, setLocalValues] = useState<string[]>(multiple ? values ?? [] : value ? [value] : []);
  const prevIncomingRef = useRef<string[]>(multiple ? values ?? [] : value ? [value] : []);

  useEffect(() => {
    const incoming = multiple ? values ?? [] : value ? [value] : [];
    const prev = prevIncomingRef.current;
    const changed = prev.length !== incoming.length || prev.some((id, i) => id !== incoming[i]);
    if (changed) {
      prevIncomingRef.current = incoming;
      setLocalValues(incoming);
    }
  }, [multiple, value, values]);

  const selectedValues = localValues;

  function toggleValue(profileId: string) {
    if (!multiple || !onValuesChange) return;
    const nextValues = selectedValues.includes(profileId)
      ? selectedValues.filter((id) => id !== profileId)
      : [...selectedValues, profileId];
    setLocalValues(nextValues);
    onValuesChange(nextValues);
  }

  if (compact) {
    return (
      <div className="flex-1 min-w-[140px]">
        <label className="sr-only">{label}</label>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full h-7 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
          disabled={isLoading}
        >
          <option value="">Unassigned</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name ?? profile.email}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            if (multiple) {
              setLocalValues([]);
              onValuesChange?.([]);
              return;
            }
            onChange(undefined);
          }}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
            selectedValues.length === 0
              ? "border-[#FF4533]/40 bg-[#FF4533]/10 text-white"
              : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
          )}
        >
          <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[10px] font-semibold text-white/40">
            ?
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Unassigned</p>
            <p className="text-xs text-[#8888AA]">No team member selected</p>
          </div>
        </button>

        {isLoading ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-[#8888AA]">
            Loading team members...
          </div>
        ) : (
          profiles.map((profile) => {
            const selected = selectedValues.includes(profile.id);
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => (multiple ? toggleValue(profile.id) : onChange(profile.id))}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "border-[#FF4533]/40 bg-[#FF4533]/10 text-white"
                    : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                )}
              >
                <AssigneeAvatar profile={profile} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile.full_name ?? "Unknown"}</p>
                  <p className="text-xs text-[#8888AA] truncate">{profile.email}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
