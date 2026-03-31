"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, LayoutGrid, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useArchiveList } from "@/hooks/tasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { List } from "@/types/tasks";

interface ParkedListsPanelProps {
  lists: List[];
  onCreateNew: () => void;
  onEditList?: (list: List) => void;
}

export function ParkedListsPanel({ lists, onCreateNew, onEditList }: ParkedListsPanelProps) {
  const router = useRouter();
  const archiveList = useArchiveList();

  return (
    <div className="w-64 flex-shrink-0 flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8888AA]">My Lists</span>
        <span className="text-[11px] text-[#8888AA]">{lists.length}</span>
      </div>

      {/* Permanent all-lists button */}
      <div className="px-2 pt-2 flex-shrink-0">
        <button
          onClick={() => router.push("/dashboard/project-hub/board/all")}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#FF4533] flex-shrink-0" />
          <span className="text-sm font-semibold text-white/90">All Lists</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/25 ml-auto flex-shrink-0" />
        </button>
      </div>

      {/* List items */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {lists.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-[#8888AA]/60">No lists yet</p>
          </div>
        ) : (
          lists.map((list) => (
            <div key={list.id} className="group relative">
              <button
                onClick={() => router.push(`/dashboard/project-hub/board/${list.id}`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors text-left"
              >
                {/* Color stripe */}
                <div
                  className="w-1 h-5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: list.color ?? "#8888AA" }}
                />
                {/* Name */}
                <span className="text-sm text-white/90 flex-1 truncate">{list.name}</span>
                {/* Pending badge */}
                {(list.pending_task_count ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-[#8888AA] bg-white/[0.06] px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {list.pending_task_count}
                  </span>
                )}
                {/* Arrow slot (slides out on hover to reveal actions) */}
                <div className="relative w-6 h-6 flex-shrink-0 ml-0.5 overflow-hidden">
                  <ChevronRight className="absolute inset-0 m-auto w-3.5 h-3.5 text-white/20 group-hover:text-white/45 transition-all duration-200 ease-out group-hover:opacity-0 group-hover:-translate-x-3" />
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 translate-x-2 opacity-0 pointer-events-none group-hover:translate-x-0 group-hover:opacity-100 group-hover:pointer-events-auto w-6 h-6 rounded-lg flex items-center justify-center text-white/35 hover:text-white/80 hover:bg-white/[0.08] transition-all duration-200 ease-out"
                    aria-label="List actions"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditList?.(list);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit list
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveList.mutate(list.id);
                    }}
                    className="gap-2 text-red-400 focus:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete list
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Footer: New project button */}
      <div className="px-3 py-3 border-t border-white/[0.06] flex-shrink-0">
        <button
          onClick={onCreateNew}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium",
            "text-[#8888AA] hover:text-white hover:bg-white/[0.06] transition-colors"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          New List
        </button>
      </div>
    </div>
  );
}
