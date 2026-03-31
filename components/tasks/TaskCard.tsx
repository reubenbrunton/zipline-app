"use client";

import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/tasks-mock";
import { useUpdateTask, useDeleteTask, useUpdateSubtask } from "@/hooks/tasks";
import type { Task, TaskStatus, Priority } from "@/types/tasks";

const STATUS_ORDER: TaskStatus[] = ["backlog", "this_week", "today", "done"];

const PRIORITY_COLORS = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-gray-500",
};

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

interface TaskCardProps {
  task: Task;
  listId: string;
  onClick: () => void;
  isOverlay?: boolean;
  className?: string;
}

export function TaskCard({ task, listId, onClick, isOverlay, className }: TaskCardProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateSubtask = useUpdateSubtask(listId);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const priorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!priorityOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [priorityOpen]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isOverlay,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const isDone = task.status === "done" || !!task.completed_at;
  const subtasks = task.subtasks ?? [];
  const completedSubtasks = subtasks.filter((s) => s.is_complete).length;

  const currentStatusIdx = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = currentStatusIdx > 0;
  const canMoveRight = currentStatusIdx < STATUS_ORDER.length - 1;

  function handleMoveLeft(e: React.MouseEvent) {
    e.stopPropagation();
    if (canMoveLeft) {
      updateTask.mutate({ id: task.id, patch: { status: STATUS_ORDER[currentStatusIdx - 1] } });
    }
  }

  function handleMoveRight(e: React.MouseEvent) {
    e.stopPropagation();
    if (canMoveRight) {
      updateTask.mutate({ id: task.id, patch: { status: STATUS_ORDER[currentStatusIdx + 1] } });
    }
  }

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    updateTask.mutate({
      id: task.id,
      patch: { status: isDone ? "today" : "done" },
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    deleteTask.mutate(task.id);
  }

  function handleSubtaskToggle(e: React.MouseEvent, subtaskId: string, current: boolean) {
    e.stopPropagation();
    updateSubtask.mutate({ id: subtaskId, patch: { is_complete: !current } });
  }

  // Ghost placeholder when being dragged — no transform, stays in place
  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-3 mb-2 min-h-[80px]"
      />
    );
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : { ...listeners, ...attributes })}
      onClick={onClick}
      className={cn(
        "bg-white/[0.07] backdrop-blur-xl rounded-xl border border-white/[0.07] p-3 mb-2 cursor-pointer",
        "hover:bg-white/[0.1] hover:shadow-lg hover:shadow-black/20 hover:border-white/[0.12] transition-all duration-150 group",
        isDone && "opacity-60",
        isOverlay && "rotate-2 shadow-2xl opacity-90",
        className
      )}
    >
      {/* Title */}
      <p
        className={cn(
          "text-sm font-medium text-white leading-snug line-clamp-2 mb-1.5",
          isDone && "line-through text-white/50"
        )}
      >
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-[#8888AA] line-clamp-1 mb-2">{task.description}</p>
      )}

      {/* Subtasks list */}
      {subtasks.length > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {subtasks.map((subtask) => (
            <button
              key={subtask.id}
              onClick={(e) => handleSubtaskToggle(e, subtask.id, subtask.is_complete)}
              className="flex items-center gap-2 w-full text-left group/subtask"
            >
              <span
                className={cn(
                  "flex-shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors",
                  subtask.is_complete
                    ? "bg-emerald-500/20 border-emerald-500/60"
                    : "border-white/20 group-hover/subtask:border-white/40"
                )}
              >
                {subtask.is_complete && <Check className="w-2 h-2 text-emerald-400" />}
              </span>
              <span
                className={cn(
                  "text-xs leading-snug transition-colors",
                  subtask.is_complete
                    ? "line-through text-white/30"
                    : "text-white/60 group-hover/subtask:text-white/80"
                )}
              >
                {subtask.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority dot — click to change */}
        <div className="relative flex-shrink-0" ref={priorityRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setPriorityOpen((v) => !v); }}
            className={cn(
              "w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform cursor-pointer",
              PRIORITY_COLORS[task.priority]
            )}
            title={`Priority: ${task.priority} — click to change`}
          />
          {priorityOpen && (
            <div className="absolute bottom-5 left-0 z-30 bg-[#1A1A2E] border border-white/[0.1] rounded-xl shadow-2xl py-1.5 min-w-[110px]">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask.mutate({ id: task.id, patch: { priority: p } });
                    setPriorityOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-xs capitalize transition-colors hover:bg-white/[0.06]",
                    task.priority === p ? "text-white font-semibold" : "text-white/60"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", PRIORITY_COLORS[p])} />
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time estimate */}
        {task.time_estimate_minutes && (
          <span className="flex items-center gap-1 text-xs text-[#8888AA]">
            <Clock className="w-3 h-3" />
            {formatMinutes(task.time_estimate_minutes)}
          </span>
        )}

        {/* Subtask progress count */}
        {subtasks.length > 0 && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              completedSubtasks === subtasks.length ? "text-emerald-400" : "text-[#8888AA]"
            )}
          >
            <Check className="w-3 h-3" />
            {completedSubtasks}/{subtasks.length}
          </span>
        )}

        {/* Assignee avatar */}
        {task.assignee && (
          <div className="ml-auto flex-shrink-0" title={task.assignee.full_name ?? task.assignee.email}>
            {task.assignee.avatar_url ? (
              <img
                src={task.assignee.avatar_url}
                alt={task.assignee.full_name ?? ""}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-white/10",
                  getAvatarColor(task.assignee.full_name ?? task.assignee.email)
                )}
              >
                {getInitials(task.assignee.full_name ?? task.assignee.email)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {!isOverlay && (
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleMoveLeft}
            disabled={!canMoveLeft}
            className="flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white/80 hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMoveRight}
            disabled={!canMoveRight}
            className="flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white/80 hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Move right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleComplete}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded transition-colors",
              isDone
                ? "text-emerald-400 hover:bg-emerald-400/10"
                : "text-white/40 hover:text-emerald-400 hover:bg-emerald-400/10"
            )}
            title={isDone ? "Mark incomplete" : "Mark done"}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-auto"
            title="Delete task"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
