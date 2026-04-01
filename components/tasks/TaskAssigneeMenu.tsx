"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/hooks/tasks";
import { AssigneeAvatar } from "./AssigneeAvatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/types/tasks";

function uniqueIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function AssigneeStack({ profiles, size = "xs" }: { profiles: Profile[]; size?: "xs" | "sm" | "md" }) {
  if (profiles.length === 0) {
    return (
      <div className="w-5 h-5 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/40">
        <Users className="w-3 h-3" />
      </div>
    );
  }

  const visibleProfiles = profiles.slice(0, 3);
  const overflow = profiles.length - visibleProfiles.length;

  return (
    <div className="flex items-center">
      {visibleProfiles.map((profile, index) => (
        <div key={profile.id} className={cn(index > 0 && "-ml-1.5")}>
          <AssigneeAvatar profile={profile} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className="-ml-1.5 w-5 h-5 rounded-full bg-white/[0.08] ring-1 ring-white/10 flex items-center justify-center text-[9px] font-bold text-white/70">
          +{overflow}
        </div>
      )}
    </div>
  );
}

interface TaskAssigneeMenuProps {
  assigneeIds?: string[];
  onChange: (assigneeIds: string[]) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function TaskAssigneeMenu({
  assigneeIds = [],
  onChange,
  compact = false,
  disabled = false,
}: TaskAssigneeMenuProps) {
  const { data: profiles = [], isLoading } = useProfiles();
  const [localIds, setLocalIds] = useState<string[]>(uniqueIds(assigneeIds));

  useEffect(() => {
    setLocalIds(uniqueIds(assigneeIds));
  }, [assigneeIds]);

  const normalizedIds = localIds;
  const selectedProfiles = normalizedIds
    .map((assigneeId) => profiles.find((profile) => profile.id === assigneeId))
    .filter((profile): profile is Profile => Boolean(profile));

  function toggleAssignee(profileId: string) {
    const nextIds = normalizedIds.includes(profileId)
      ? normalizedIds.filter((id) => id !== profileId)
      : [...normalizedIds, profileId];
    setLocalIds(nextIds);
    onChange(nextIds);
  }

  const summaryLabel =
    selectedProfiles.length === 0
      ? "Assign"
      : selectedProfiles.length === 1
      ? selectedProfiles[0].full_name ?? selectedProfiles[0].email
      : `${selectedProfiles.length} assigned`;

  const trigger = compact ? (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className="h-7 min-w-[120px] px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white hover:bg-white/[0.07] transition-colors flex items-center gap-2 disabled:opacity-50"
    >
      <AssigneeStack profiles={selectedProfiles} />
      <span className="truncate">{summaryLabel}</span>
    </button>
  ) : (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className="ml-auto flex items-center gap-2 rounded-lg hover:bg-white/[0.06] px-1.5 py-1 transition-colors disabled:opacity-50"
      title={selectedProfiles.length > 0 ? summaryLabel : "Assign team members"}
    >
      <AssigneeStack profiles={selectedProfiles} />
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={compact ? "start" : "end"}
        className="w-64"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel>Task Assignees</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setLocalIds([]);
            onChange([]);
          }}
        >
          Clear all assignees
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>Loading team members...</DropdownMenuItem>
        ) : (
          profiles.map((profile) => {
            const checked = normalizedIds.includes(profile.id);

            return (
              <DropdownMenuCheckboxItem
                key={profile.id}
                checked={checked}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleAssignee(profile.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AssigneeAvatar profile={profile} size="xs" />
                  <div className="min-w-0">
                    <p className="truncate">{profile.full_name ?? "Unknown"}</p>
                    <p className="text-[11px] text-[#8888AA] truncate">{profile.email}</p>
                  </div>
                </div>
              </DropdownMenuCheckboxItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
