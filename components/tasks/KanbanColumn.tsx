"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { useCreateTask } from "@/hooks/tasks";
import type { Task, TaskStatus } from "@/types/tasks";
import { TaskAssigneeMenu } from "./TaskAssigneeMenu";

const COLUMN_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; accent: string }
> = {
  backlog: {
    label: "Backlog",
    color: "#8888AA",
    accent: "bg-[#8888AA]/10 text-[#8888AA]",
  },
  this_week: {
    label: "This Week",
    color: "#6366F1",
    accent: "bg-indigo-500/10 text-indigo-400",
  },
  today: {
    label: "Today",
    color: "#FF4533",
    accent: "bg-[#FF4533]/10 text-[#FF4533]",
  },
  done: {
    label: "Done",
    color: "#10B981",
    accent: "bg-emerald-500/10 text-emerald-400",
  },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  listId: string;
  onTaskClick: (task: Task) => void;
  droppedTask?: { id: string; yOffset: number } | null;
}

export function KanbanColumn({ status, tasks, listId, onTaskClick, droppedTask }: KanbanColumnProps) {
  const config = COLUMN_CONFIG[status];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEstimate, setNewEstimate] = useState("");
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const createTask = useCreateTask();
  const isAllView = listId === "all";

  const { setNodeRef, isOver } = useDroppable({ id: status });

  useEffect(() => {
    if (showAddForm) {
      inputRef.current?.focus();
    }
  }, [showAddForm]);

  function handleAdd() {
    if (!newTitle.trim() || isAllView) return;
    createTask.mutate(
      {
        list_id: listId,
        title: newTitle.trim(),
        status,
        assignee_ids: newAssigneeIds,
        time_estimate_minutes: newEstimate ? parseInt(newEstimate) : undefined,
      },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewEstimate("");
          setNewAssigneeIds([]);
          setShowAddForm(false);
        },
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setNewTitle("");
      setNewEstimate("");
      setNewAssigneeIds([]);
      setShowAddForm(false);
    }
  }

  // Today column progress
  const todayDone =
    status === "today" ? tasks.filter((t) => !!t.completed_at).length : 0;
  const todayTotal = status === "today" ? tasks.length : 0;

  return (
    <div className="w-72 flex-shrink-0 self-start h-fit flex flex-col rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.14] p-3">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-sm font-semibold text-white flex-1">{config.label}</span>
        {/* Animate the task count badge when count changes */}
        <motion.span
          key={tasks.length}
          initial={{ scale: 1.4, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", config.accent)}
        >
          {tasks.length}
        </motion.span>
        {status === "today" && todayTotal > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/40">
            {todayDone}/{todayTotal}
          </span>
        )}
        {!isAllView && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
            title="Add task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Droppable task list */}
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-lg p-1 transition-colors duration-150 min-h-[120px]",
          isOver ? "bg-white/[0.04]" : "bg-transparent"
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.length === 0 && !showAddForm && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="border border-dashed border-white/[0.08] rounded-xl p-4 text-center"
            >
              <p className="text-xs text-[#8888AA]">No tasks</p>
            </motion.div>
          )}

          {tasks.map((task) => {
            const isDropped = droppedTask?.id === task.id;
            return (
              <motion.div
                key={task.id}
                layout
                initial={
                  isDropped
                    ? { opacity: 0.85, y: droppedTask!.yOffset, scale: 1 }
                    : { opacity: 0, y: -12, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
              >
                <TaskCard
                  task={task}
                  listId={listId}
                  onClick={() => onTaskClick(task)}
                />
              </motion.div>
            );
          })}

          {/* Inline add form */}
          {showAddForm && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="bg-white/[0.07] rounded-xl border border-white/[0.1] p-3 mb-2"
            >
              <input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Task title…"
                className="w-full bg-transparent text-sm text-white placeholder:text-[#8888AA] focus:outline-none mb-2"
              />
              <div className="flex items-center gap-2">
                <TaskAssigneeMenu compact assigneeIds={newAssigneeIds} onChange={setNewAssigneeIds} />
                <input
                  type="number"
                  value={newEstimate}
                  onChange={(e) => setNewEstimate(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Est. (min)"
                  className="w-24 h-7 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-[#8888AA]/60 focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newTitle.trim() || createTask.isPending}
                  className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setNewTitle("");
                    setNewEstimate("");
                    setNewAssigneeIds([]);
                    setShowAddForm(false);
                  }}
                  className="px-2 py-1 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
