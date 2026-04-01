"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/tasks-api";
import { useArchiveList } from "@/hooks/tasks";
import type { List, Profile } from "@/types/tasks";

// ---------------------------------------------------------------------------
// Avatar helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "bg-violet-500/80",
  "bg-sky-500/80",
  "bg-emerald-500/80",
  "bg-amber-500/80",
  "bg-rose-500/80",
  "bg-indigo-500/80",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ profile }: { profile: Profile }) {
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name ?? ""}
        className="w-6 h-6 rounded-full object-cover ring-1 ring-[#12121E]"
        title={profile.full_name ?? profile.email}
      />
    );
  }
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-[#12121E]",
        getAvatarColor(profile.full_name ?? profile.email)
      )}
      title={profile.full_name ?? profile.email}
    >
      {getInitials(profile.full_name ?? profile.email)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface ListKanbanCardProps {
  list: List;
  isOverlay?: boolean;
  onEdit?: (list: List) => void;
}

export function ListKanbanCard({ list, isOverlay, onEdit }: ListKanbanCardProps) {
  const router = useRouter();
  const archiveList = useArchiveList();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuOpen]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: list.id,
    data: { list },
    disabled: isOverlay,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const members = list.members ?? [];
  const visibleMembers = members.slice(0, 3);
  const overflow = members.length - 3;

  // Ghost placeholder while dragging — no style/transform
  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] min-h-[160px] mb-2"
      />
    );
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : { ...listeners, ...attributes })}
      onClick={() => router.push(`/dashboard/project-hub/board/${list.id}`)}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] backdrop-blur-xl",
        "p-5 pb-5 mb-2 cursor-pointer select-none min-h-[160px] flex flex-col justify-between",
        "hover:bg-white/[0.10] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5",
        "transition-all duration-150",
        isOverlay && "rotate-2 shadow-2xl opacity-90",
      )}
    >
      {/* Color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: list.color ?? "#8888AA" }}
      />

      {/* Menu button — top right, shown on hover */}
      {!isOverlay && (
        <div ref={menuRef} className="absolute top-3 right-3 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/[0.12] text-[#8888AA] hover:text-white"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute top-7 right-0 bg-[#1A1A2E] border border-white/[0.1] rounded-xl shadow-2xl py-1 min-w-[140px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(list);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/80 hover:bg-white/[0.06] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit project
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  archiveList.mutate(list.id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-white/[0.06] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="pl-2">
        {/* Name */}
        <p className="text-sm font-bold text-white leading-tight mb-1 pr-6">{list.name}</p>
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.08] text-white/80 border border-white/[0.1]">
            {list.client_name ?? "No client"}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs text-[#8888AA] mb-3">
          {(list.total_task_count ?? 0) === 0 ? (
            <span>No tasks</span>
          ) : (list.pending_task_count ?? 0) > 0 ? (
            <span>{list.pending_task_count} pending</span>
          ) : (
            <span className="text-emerald-400/80">All caught up</span>
          )}
          {list.total_estimate_minutes ? (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatMinutes(list.total_estimate_minutes)}
              </span>
            </>
          ) : null}
        </div>

        {/* Footer: avatars + high priority */}
        <div className="flex items-center justify-between">
          {/* Avatar stack */}
          {visibleMembers.length > 0 ? (
            <div className="flex items-center">
              {visibleMembers.map((profile, i) => (
                <div key={profile.id} className={cn(i > 0 && "-ml-1.5")}>
                  <Avatar profile={profile} />
                </div>
              ))}
              {overflow > 0 && (
                <div className="-ml-1.5 w-6 h-6 rounded-full bg-white/[0.1] border border-white/20 flex items-center justify-center text-[9px] text-[#8888AA] font-bold">
                  +{overflow}
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* High priority indicator */}
          {list.has_high_priority && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-red-400">
              <AlertCircle className="w-3 h-3" />
              HIGH
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
