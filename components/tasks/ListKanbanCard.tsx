"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Archive, Camera, CheckCircle2, Clock, DollarSign, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/tasks-api";
import { useArchiveList, useUpdateList } from "@/hooks/tasks";
import type { List, RevisionVersion } from "@/types/tasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskAssigneeMenu } from "./TaskAssigneeMenu";
import { BookShootModal } from "./BookShootModal";

// ---------------------------------------------------------------------------
// Revision version config
// ---------------------------------------------------------------------------

const REVISION_OPTIONS: { value: RevisionVersion; label: string; color: string }[] = [
  { value: "v1_sent",         label: "V1 Sent",          color: "#3B82F6" },
  { value: "v2_sent",         label: "V2 Revisions",     color: "#A855F7" },
  { value: "v3_sent",         label: "V3 Revisions",     color: "#F59E0B" },
  { value: "final_sent",      label: "Final",            color: "#FF4533" },
  { value: "client_approved", label: "Client Approved",  color: "#10B981" },
];

function getRevisionConfig(v: RevisionVersion) {
  return REVISION_OPTIONS.find((o) => o.value === v) ?? REVISION_OPTIONS[0];
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface ListKanbanCardProps {
  list: List;
  isOverlay?: boolean;
  onEdit?: (list: List) => void;
  isAdmin?: boolean;
  showDealValues?: boolean;
}

export function ListKanbanCard({ list, isOverlay, onEdit, isAdmin, showDealValues }: ListKanbanCardProps) {
  const router = useRouter();
  const archiveList = useArchiveList();
  const updateList = useUpdateList();
  const [shootModalOpen, setShootModalOpen] = useState(false);
  const [shootSaving, setShootSaving] = useState(false);
  const [deliverableExpanded, setDeliverableExpanded] = useState(false);
  const [editingDealValue, setEditingDealValue] = useState(false);
  const [dealValueInput, setDealValueInput] = useState("");
  const dealValueInputRef = useRef<HTMLInputElement>(null);
  const cancelDealValueRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: list.id,
    data: { list },
    disabled: isOverlay,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] min-h-[160px] mb-2"
      />
    );
  }

  const isCompleted = list.stage === "completed";
  const isProduction = list.stage === "production";
  const isRevisions = list.stage === "revisions";
  const isManagement = list.stage === "management";
  const shootBooked = !!list.shoot_date;

  // Management day counter
  const managementDays = (() => {
    if (!list.management_started_at) return 0;
    const ms = Date.now() - new Date(list.management_started_at).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  })();
  const managementExpired = managementDays >= 30;

  // Current revision (defaults to v1_sent display if null)
  const currentRevision = list.revision_version ?? null;
  const revConfig = currentRevision ? getRevisionConfig(currentRevision) : null;

  async function handleSaveShoot(data: {
    shoot_date: string;
    shoot_time?: string;
    shoot_deliverables?: string;
    shoot_invitee_ids: string[];
  }) {
    setShootSaving(true);
    try {
      await updateList.mutateAsync({ id: list.id, patch: data });
      setShootModalOpen(false);
    } catch (err) {
      console.error("Failed to save shoot booking:", err);
    } finally {
      setShootSaving(false);
    }
  }

  function formatShootDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatDealValue(value: number | null | undefined): string {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }

  function parseDealValue(input: string): number | null {
    const cleaned = input.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? null : num;
  }

  function startEditingDealValue(e: React.MouseEvent) {
    e.stopPropagation();
    cancelDealValueRef.current = false;
    setDealValueInput(list.deal_value ? String(list.deal_value) : "");
    setEditingDealValue(true);
    setTimeout(() => dealValueInputRef.current?.focus(), 0);
  }

  function commitDealValue() {
    if (cancelDealValueRef.current) return;
    const newValue = parseDealValue(dealValueInput);
    updateList.mutate({ id: list.id, patch: { deal_value: newValue } });
    setEditingDealValue(false);
  }

  function handleDealValueKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      dealValueInputRef.current?.blur(); // blur triggers onBlur → commitDealValue
    }
    if (e.key === "Escape") {
      cancelDealValueRef.current = true;
      setEditingDealValue(false);
    }
  }

  return (
    <>
      <div
        ref={isOverlay ? undefined : setNodeRef}
        style={style}
        {...(isOverlay ? {} : { ...listeners, ...attributes })}
        onClick={() => router.push(`/dashboard/project-hub/board/${list.id}`)}
        className={cn(
          "group relative rounded-xl border bg-white/[0.07] backdrop-blur-xl",
          "p-5 pb-5 mb-2 cursor-pointer select-none min-h-[160px] flex flex-col justify-between",
          "transition-colors duration-150",
          isCompleted
            ? "border-emerald-500/20 opacity-70 hover:opacity-90"
            : managementExpired
            ? "border-[#FF4533]/60 shadow-[0_0_0_1px_rgba(255,69,51,0.3)]"
            : "border-white/[0.07] hover:bg-white/[0.10] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5",
          isOverlay && "rotate-2 shadow-2xl opacity-90",
        )}
      >
        {/* Color stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ backgroundColor: managementExpired ? "#FF4533" : (list.color ?? "#8888AA") }}
        />

        {/* Menu button — top right, shown on hover */}
        {!isOverlay && (
          <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/[0.12] text-[#8888AA] hover:text-white">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onSelect={() => onEdit?.(list)} className="gap-2.5 text-xs">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => archiveList.mutate(list.id)} className="gap-2.5 text-xs text-red-400 focus:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Content */}
        <div className="pl-2">
          {/* Name */}
          <div className="flex items-center gap-2 mb-1 pr-6">
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            <p className={cn("text-sm font-bold leading-tight", isCompleted ? "line-through text-white/40" : "text-white")}>{list.name}</p>
          </div>
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
            <TaskAssigneeMenu
              compact
              assigneeIds={list.assignee_ids ?? (list.assignee_id ? [list.assignee_id] : [])}
              onChange={(assignee_ids) =>
                updateList.mutate({ id: list.id, patch: { assignee_ids } })
              }
            />

            {list.has_high_priority && (
              <div className="flex items-center gap-1 text-[10px] font-medium text-red-400">
                <AlertCircle className="w-3 h-3" />
                HIGH
              </div>
            )}
          </div>
        </div>

        {/* ── Book a Shoot — production stage only ─────────────────────────── */}
        {isProduction && !isOverlay && (
          <div
            className="mt-3 pt-3 border-t border-white/[0.06] pl-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {shootBooked ? (
              <div className="space-y-1.5">
                <button
                  onClick={() => setShootModalOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Shoot Booked</span>
                    <span className="text-[11px] font-normal text-emerald-400/70">{formatShootDate(list.shoot_date!)}</span>
                  </div>
                </button>
                {list.shoot_deliverables && (
                  <div className="px-1">
                    <p className={cn("text-[11px] text-white/40 leading-relaxed", !deliverableExpanded && "line-clamp-2")}>
                      {list.shoot_deliverables}
                    </p>
                    {list.shoot_deliverables.length > 80 && (
                      <button
                        onClick={() => setDeliverableExpanded((v) => !v)}
                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors mt-0.5"
                      >
                        {deliverableExpanded ? "See less" : "See more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShootModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Book a Shoot
              </button>
            )}
          </div>
        )}

        {/* ── Revision version — revisions stage only ───────────────────────── */}
        {isRevisions && !isOverlay && (
          <div
            className="mt-3 pt-3 border-t border-white/[0.06] pl-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors border",
                    revConfig
                      ? "border-transparent"
                      : "border-dashed border-white/[0.15] text-white/50 hover:text-white/70 hover:border-white/25"
                  )}
                  style={revConfig ? {
                    backgroundColor: `${revConfig.color}18`,
                    color: revConfig.color,
                    borderColor: `${revConfig.color}40`,
                    border: "1px solid",
                  } : undefined}
                >
                  <span>{revConfig ? revConfig.label : "Select project status"}</span>
                  <span className="opacity-50 text-[10px]">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[160px]">
                {REVISION_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onSelect={() => updateList.mutate({ id: list.id, patch: { revision_version: opt.value } })}
                    className={cn("gap-2.5", currentRevision === opt.value && "font-semibold")}
                    style={{ color: opt.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                    {opt.label}
                    {currentRevision === opt.value && <span className="ml-auto text-[10px]">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Management day counter — management stage only ────────────────── */}
        {isManagement && !isOverlay && (
          <div
            className="mt-3 pt-3 border-t border-white/[0.06] pl-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-xs border",
              managementExpired
                ? "bg-[#FF4533]/10 border-[#FF4533]/30 text-[#FF4533]"
                : "bg-white/[0.05] border-white/[0.08] text-white/60"
            )}>
              <span className="font-medium">
                {managementExpired ? "Management period ended" : "Management"}
              </span>
              <span className={cn("font-bold tabular-nums", managementExpired ? "text-[#FF4533]" : "text-white/80")}>
                {managementDays}<span className="font-normal text-[10px] ml-0.5">/ 30 days</span>
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", managementExpired ? "bg-[#FF4533]" : "bg-white/30")}
                style={{ width: `${Math.min((managementDays / 30) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Archive button — completed stage only ─────────────────────────── */}
        {isCompleted && !isOverlay && (
          <div
            className="mt-3 pt-3 border-t border-white/[0.06] pl-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => archiveList.mutate(list.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive Project
            </button>
          </div>
        )}

        {/* ── Deal value — admin only, always at bottom ─────────────────────── */}
        {isAdmin && showDealValues && !isOverlay && (
          <div
            className="mt-3 pt-3 border-t border-white/[0.06] pl-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {editingDealValue ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.12]">
                <DollarSign className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <input
                  ref={dealValueInputRef}
                  value={dealValueInput}
                  onChange={(e) => setDealValueInput(e.target.value)}
                  onBlur={commitDealValue}
                  onKeyDown={handleDealValueKeyDown}
                  placeholder="0"
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none w-full"
                />
              </div>
            ) : (
              <button
                onClick={startEditingDealValue}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors w-full text-left",
                  list.deal_value
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
                    : "bg-white/[0.04] border border-dashed border-white/[0.12] text-white/30 hover:text-white/50 hover:border-white/20"
                )}
              >
                <DollarSign className="w-3 h-3 flex-shrink-0" />
                <span className="font-semibold">{formatDealValue(list.deal_value)}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Shoot modal — outside the draggable/clickable card */}
      {isProduction && !isOverlay && (
        <BookShootModal
          open={shootModalOpen}
          onClose={() => setShootModalOpen(false)}
          onSave={handleSaveShoot}
          saving={shootSaving}
          existing={shootBooked ? {
            shoot_date: list.shoot_date,
            shoot_time: list.shoot_time,
            shoot_deliverables: list.shoot_deliverables,
            shoot_invitee_ids: list.shoot_invitee_ids,
          } : undefined}
        />
      )}
    </>
  );
}
