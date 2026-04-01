"use client";

import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Archive, LayoutGrid } from "lucide-react";
import { formatMinutes } from "@/lib/tasks-api";
import { useArchiveList } from "@/hooks/tasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { List } from "@/types/tasks";
import { AssigneeAvatar } from "./AssigneeAvatar";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
export function ListCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white/[0.07] border border-white/[0.07] min-h-[180px]" />
  );
}

// ---------------------------------------------------------------------------
// All Lists card
// ---------------------------------------------------------------------------
function AllListsCard({
  pendingCount,
  estimateMinutes,
}: {
  pendingCount: number;
  estimateMinutes: number;
}) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push("/dashboard/project-hub/board/all")}
      className="relative rounded-xl min-h-[180px] p-5 cursor-pointer transition-all duration-150 hover:scale-[1.01] group overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,69,51,0.15) 0%, rgba(99,102,241,0.08) 100%)",
        border: "1px solid rgba(255,69,51,0.25)",
      }}
    >
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF4533]/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col h-full gap-3">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-[#FF4533]/20 flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-4 h-4 text-[#FF4533]" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">All Lists</p>
          <p className="text-xs text-[#8888AA] mt-0.5">Aggregated view</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF4533]/15 text-[#FF4533] font-medium">
              {pendingCount} pending
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              All caught up
            </span>
          )}
          {estimateMinutes > 0 && (
            <span className="text-xs text-[#8888AA]">
              Est. {formatMinutes(estimateMinutes)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Project card
// ---------------------------------------------------------------------------
function CreateListCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl min-h-[180px] p-5 cursor-pointer border border-dashed border-white/[0.15] hover:border-white/30 hover:bg-white/[0.02] transition-all duration-150 flex flex-col items-center justify-center gap-3 group"
    >
      <div className="w-10 h-10 rounded-xl border-2 border-dashed border-white/20 group-hover:border-white/40 flex items-center justify-center transition-colors">
        <Plus className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
      </div>
      <p className="text-sm font-medium text-white/30 group-hover:text-white/60 transition-colors">
        Create Project
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regular list card
// ---------------------------------------------------------------------------
function RegularListCard({
  list,
  onArchive,
}: {
  list: List;
  onArchive: () => void;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/project-hub/board/${list.id}`)}
      className="relative rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.07] min-h-[180px] p-5 cursor-pointer hover:bg-white/[0.1] transition-all duration-150 group overflow-hidden"
    >
      {/* Color stripe */}
      {list.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: list.color }}
        />
      )}

      {/* Options menu — hover reveal */}
      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/[0.08] transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onArchive}
              className="text-amber-400 focus:text-amber-300 gap-2"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col h-full gap-3">
        {/* Color dot + name */}
        <div className="flex items-center gap-2 pr-8">
          {list.color && (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: list.color }}
            />
          )}
          <p className="text-sm font-semibold text-white truncate">{list.name}</p>
        </div>
        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.08] text-white/80 border border-white/[0.1]">
          {list.client_name ?? "No client"}
        </span>

        {/* Stats */}
        <div className="flex-1 flex flex-col justify-end gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {(list.total_task_count ?? 0) === 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 font-medium">
                No tasks
              </span>
            ) : (list.pending_task_count ?? 0) > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 font-medium">
                {list.pending_task_count} tasks
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                All done
              </span>
            )}
            {(list.total_estimate_minutes ?? 0) > 0 && (
              <span className="text-xs text-[#8888AA]">
                Est. {formatMinutes(list.total_estimate_minutes)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {list.assignee ? (
              <>
                <AssigneeAvatar profile={list.assignee} />
                <span className="text-xs text-white/70 truncate">
                  {list.assignee.full_name ?? list.assignee.email}
                </span>
              </>
            ) : (
              <span className="text-xs text-[#8888AA]">Unassigned</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
interface ListCardProps {
  variant: "all" | "list" | "create";
  list?: List;
  allPendingCount?: number;
  allEstimateMinutes?: number;
  onCreateClick?: () => void;
}

export function ListCard({
  variant,
  list,
  allPendingCount = 0,
  allEstimateMinutes = 0,
  onCreateClick,
}: ListCardProps) {
  const archiveList = useArchiveList();

  if (variant === "all") {
    return (
      <AllListsCard
        pendingCount={allPendingCount}
        estimateMinutes={allEstimateMinutes}
      />
    );
  }

  if (variant === "create") {
    return <CreateListCard onClick={onCreateClick ?? (() => {})} />;
  }

  if (!list) return null;

  return (
    <RegularListCard
      list={list}
      onArchive={() => archiveList.mutate(list.id)}
    />
  );
}
