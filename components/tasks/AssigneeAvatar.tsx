"use client";

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
