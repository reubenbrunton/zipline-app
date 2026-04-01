"use client";

import { useState, useRef } from "react";
import { Clock, AlignLeft, Plus, Trash2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUpdateTask, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from "@/hooks/tasks";
import type { Task, TaskStatus, Priority, Subtask } from "@/types/tasks";
import { AssigneePicker } from "./AssigneePicker";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "this_week", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  { value: "medium", label: "Medium", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "high", label: "High", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

interface TaskDetailModalProps {
  task: Task | null;
  listId: string;
  onClose: () => void;
}

export function TaskDetailModal({ task, listId, onClose }: TaskDetailModalProps) {
  const updateTask = useUpdateTask();
  const createSubtask = useCreateSubtask(task?.id ?? "", listId);
  const updateSubtask = useUpdateSubtask(listId);
  const deleteSubtask = useDeleteSubtask(listId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task?.title ?? "");
  const [newSubtask, setNewSubtask] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  if (!task) return null;

  const subtasks: Subtask[] = task.subtasks ?? [];

  function saveTitle() {
    if (!titleDraft.trim() || titleDraft === task!.title) {
      setTitleDraft(task!.title);
      setIsEditingTitle(false);
      return;
    }
    updateTask.mutate({ id: task!.id, patch: { title: titleDraft.trim() } });
    setIsEditingTitle(false);
  }

  function handleStatusChange(status: TaskStatus) {
    updateTask.mutate({ id: task!.id, patch: { status } });
  }

  function handlePriorityChange(priority: Priority) {
    updateTask.mutate({ id: task!.id, patch: { priority } });
  }

  function handleAddSubtask() {
    if (!newSubtask.trim()) return;
    createSubtask.mutate(
      { task_id: task!.id, title: newSubtask.trim() },
      { onSuccess: () => setNewSubtask("") }
    );
  }

  function handleSubtaskKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
    if (e.key === "Escape") setNewSubtask("");
  }

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        size="lg"
        className="max-h-[90vh] overflow-y-auto bg-white/[0.07] border-white/[0.08] backdrop-blur-xl"
      >
        {/* Title */}
        <DialogHeader>
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitleDraft(task.title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-xl font-semibold text-white bg-transparent border-b border-[#FF4533] focus:outline-none pb-1 w-full pr-8"
            />
          ) : (
            <h2
              onClick={() => {
                setTitleDraft(task.title);
                setIsEditingTitle(true);
              }}
              className="text-xl font-semibold text-white cursor-text hover:text-white/80 transition-colors pr-8 leading-snug"
              title="Click to edit"
            >
              {task.title}
            </h2>
          )}
        </DialogHeader>

        <div className="space-y-5">
          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
              Status
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    task.status === value
                      ? "bg-[#FF4533]/20 text-[#FF4533] border-[#FF4533]/40"
                      : "bg-white/[0.04] text-white/50 border-white/[0.07] hover:text-white/80 hover:bg-white/[0.08]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
              Priority
            </label>
            <div className="flex items-center gap-2">
              {PRIORITY_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handlePriorityChange(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    task.priority === value
                      ? color
                      : "bg-white/[0.04] text-white/50 border-white/[0.07] hover:text-white/80 hover:bg-white/[0.08]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AssigneePicker
            multiple
            values={task.assignee_ids ?? []}
            onChange={() => {}}
            onValuesChange={(assignee_ids) => {
              updateTask.mutate({ id: task.id, patch: { assignee_ids } });
            }}
          />

          {/* Time estimate */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Estimate (min)
            </label>
            <input
              type="number"
              defaultValue={task.time_estimate_minutes ?? ""}
              placeholder="e.g. 60"
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                updateTask.mutate({
                  id: task.id,
                  patch: { time_estimate_minutes: isNaN(val) ? undefined : val },
                });
              }}
              className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlignLeft className="w-3 h-3" /> Description
            </label>
            <textarea
              defaultValue={task.description ?? ""}
              placeholder="Add a description…"
              rows={3}
              onBlur={(e) => {
                updateTask.mutate({
                  id: task.id,
                  patch: { description: e.target.value || undefined },
                });
              }}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] resize-none"
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
              Subtasks{subtasks.length > 0 && ` (${subtasks.filter((s) => s.is_complete).length}/${subtasks.length})`}
            </label>
            <div className="space-y-1.5 mb-3">
              {subtasks.map((sub) => (
                <SubtaskRow
                  key={sub.id}
                  subtask={sub}
                  onToggle={() =>
                    updateSubtask.mutate({ id: sub.id, patch: { is_complete: !sub.is_complete } })
                  }
                  onDelete={() => deleteSubtask.mutate(sub.id)}
                />
              ))}
            </div>
            {/* Add subtask input */}
            <div className="flex items-center gap-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder="Add a subtask…"
                className="flex-1 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FF4533]/20 text-[#FF4533] hover:bg-[#FF4533]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Subtask row
// ---------------------------------------------------------------------------
function SubtaskRow({
  subtask,
  onToggle,
  onDelete,
}: {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 group/sub p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
      <button
        onClick={onToggle}
        className={cn(
          "w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors",
          subtask.is_complete
            ? "bg-emerald-500 border-emerald-500"
            : "bg-transparent border-white/20 hover:border-white/40"
        )}
      >
        {subtask.is_complete && <Check className="w-2.5 h-2.5 text-white" />}
      </button>
      <span
        className={cn(
          "text-sm flex-1",
          subtask.is_complete ? "line-through text-white/30" : "text-white/70"
        )}
      >
        {subtask.title}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover/sub:opacity-100 w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
