"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Search, LayoutGrid, ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/tasks-api";
import { useTasks, useLists, useUpdateTask } from "@/hooks/tasks";
import { KanbanColumn } from "@/components/tasks/KanbanColumn";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { AssigneeAvatar } from "@/components/tasks/AssigneeAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task, TaskStatus } from "@/types/tasks";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "this_week", label: "This Week" },
  { status: "today", label: "Today" },
  { status: "done", label: "Done" },
];

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.listId as string;
  const isAllView = listId === "all";

  const { data: tasks = [], isLoading } = useTasks(listId);
  const { data: lists = [] } = useLists();
  const updateTask = useUpdateTask();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [droppedTask, setDroppedTask] = useState<{ id: string; yOffset: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const currentList = lists.find((l) => l.id === listId);
  const displayName = isAllView ? "All Lists" : (currentList?.name ?? "Board");

  const totalPending = tasks.filter((t) => t.status !== "done").length;
  const totalMinutes = tasks
    .filter((t) => t.status !== "done")
    .reduce((sum, t) => sum + (t.time_estimate_minutes ?? 0), 0);

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    if (over && activeTask && over.id !== activeTask.status) {
      // Calculate where the dragged card currently sits relative to the top of the drop column.
      // This becomes the Framer Motion initial.y so the card animates from its real position.
      const translatedRect = active.rect.current.translated;
      const overRect = over.rect;
      const rawOffset =
        translatedRect && overRect ? translatedRect.top - overRect.top : -16;
      // Clamp to avoid jarring jumps from very far drags
      const yOffset = Math.max(-400, Math.min(400, rawOffset));

      setDroppedTask({ id: activeTask.id, yOffset });
      setTimeout(() => setDroppedTask(null), 600);

      updateTask.mutate({
        id: activeTask.id,
        patch: { status: over.id as TaskStatus },
      });
    }
    setActiveTask(null);
  }

  // When a task is clicked from the detail modal, re-find the latest version from cache
  const handleTaskClick = useCallback(
    (task: Task) => {
      // Get the freshest version of the task
      const fresh = tasks.find((t) => t.id === task.id) ?? task;
      setSelectedTask(fresh);
    },
    [tasks]
  );

  // Re-sync selected task when tasks data updates
  const latestSelectedTask =
    selectedTask ? (tasks.find((t) => t.id === selectedTask.id) ?? selectedTask) : null;

  return (
    <motion.div
      key={listId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.44, ease: "easeOut" }}
      style={{ willChange: "opacity" }}
      className="flex flex-col gap-6 w-full h-full"
    >
      {/* Header — matches dashboard page pattern */}
      <div className="flex items-center justify-between flex-shrink-0">
        {/* Left: back arrow + list name as title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/project-hub")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/[0.06] transition-colors flex-shrink-0"
            title="Back to lists"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 group">
                  {currentList?.color && !isAllView && (
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: currentList.color }}
                    />
                  )}
                  <h2 className="text-xl font-bold text-white group-hover:text-white/80 transition-colors">
                    {displayName}
                  </h2>
                  <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/project-hub/board/all")}
                  className={cn(isAllView && "text-[#FF4533]")}
                >
                  All Lists
                </DropdownMenuItem>
                {lists.length > 0 && <DropdownMenuSeparator />}
                {lists.map((list) => (
                  <DropdownMenuItem
                    key={list.id}
                    onClick={() => router.push(`/dashboard/project-hub/board/${list.id}`)}
                    className={cn(list.id === listId && "text-[#FF4533]")}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {list.color && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: list.color }}
                        />
                      )}
                      <span className="flex-1">{list.name}</span>
                      {(list.pending_task_count ?? 0) > 0 && (
                        <span className="text-xs text-[#8888AA]">{list.pending_task_count}</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm text-[#8888AA] mt-0.5">
              {totalPending > 0
                ? `${totalPending} tasks pending${totalMinutes > 0 ? ` · Est. ${formatMinutes(totalMinutes)}` : ""}`
                : isAllView
                ? "Aggregated view across all lists"
                : "All tasks complete"}
            </p>
            {!isAllView && currentList?.assignee && (
              <div className="mt-2 flex items-center gap-2">
                <AssigneeAvatar profile={currentList.assignee} size="xs" />
                <span className="text-xs text-white/70">
                  {currentList.assignee.full_name ?? currentList.assignee.email}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: icon actions */}
        <div className="flex items-center gap-1.5">
          {isAllView && (
            <span className="text-xs text-[#8888AA] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] mr-2">
              Read-only
            </span>
          )}
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-start gap-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="w-72 flex-shrink-0 h-48 animate-pulse bg-[#1A1A2E] rounded-xl" />
          ))}
        </div>
      )}

      {/* Kanban board */}
      {!isLoading && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {COLUMNS.map(({ status }) => {
              const colTasks = tasks.filter((t) => t.status === status);
              return (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={colTasks}
                  listId={listId}
                  onTaskClick={handleTaskClick}
                  droppedTask={droppedTask}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <TaskCard
                task={activeTask}
                listId={listId}
                onClick={() => {}}
                isOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task detail modal */}
      <TaskDetailModal
        task={latestSelectedTask}
        listId={listId}
        onClose={() => setSelectedTask(null)}
      />
    </motion.div>
  );
}
