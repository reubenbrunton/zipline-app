"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/tasks";

const AVATAR_COLORS = [
  "bg-violet-500/80",
  "bg-sky-500/80",
  "bg-emerald-500/80",
  "bg-amber-500/80",
  "bg-rose-500/80",
  "bg-indigo-500/80",
];

const SIZE_CLASSES = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Stacked avatars
// ---------------------------------------------------------------------------

interface AssigneeStackProps {
  profiles: Profile[];
  size?: keyof typeof SIZE_CLASSES;
}

export function AssigneeStack({ profiles, size = "xs" }: AssigneeStackProps) {
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

// ---------------------------------------------------------------------------
// Single avatar
// ---------------------------------------------------------------------------

interface AssigneeAvatarProps {
  profile: Profile;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function AssigneeAvatar({
  profile,
  size = "sm",
  className,
}: AssigneeAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const label = profile.full_name ?? profile.email;

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name ?? ""}
        className={cn("rounded-full object-cover ring-1 ring-white/10", sizeClass, className)}
        title={label}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white ring-1 ring-white/10",
        sizeClass,
        getAvatarColor(label),
        className
      )}
      title={label}
    >
      {getInitials(label)}
    </div>
  );
}
