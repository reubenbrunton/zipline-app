"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Eye, EyeOff, Maximize2, Minimize2, Plus } from "lucide-react";
import { formatMinutes } from "@/lib/tasks-api";
import { useLists, useUpdateList, useMyStats, useReorderLists } from "@/hooks/tasks";
import { useUser } from "@/hooks/useUser";
import { isTeamOwnerEmail } from "@/lib/team-admin";
import { ListKanbanColumn } from "./ListKanbanColumn";
import { ListKanbanCard } from "./ListKanbanCard";
import { CreateListModal } from "./CreateListModal";
import { ParkedListsPanel } from "./ParkedListsPanel";
import type { List, ListStage } from "@/types/tasks";

// When a column is empty, closestCenter picks the nearest card in an adjacent
// column instead of the empty droppable zone. Fix: if the pointer is inside any
// droppable container, use that hit; otherwise fall back to closestCenter.
const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args);
};

const STAGES: ListStage[] = [
  "new_project",
  "strategy",
  "scripting",
  "production",
  "post_production",
  "revisions",
  "media_buying",
  "management",
  "completed",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function ListKanbanBoard() {
  const { data: lists = [], isLoading } = useLists();
  const updateList = useUpdateList();
  const reorderLists = useReorderLists();
  const { data: myStats } = useMyStats();
  const { data: user } = useUser();
  const [activeList, setActiveList] = useState<List | null>(null);
  const [createStage, setCreateStage] = useState<ListStage | null>(null);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [showDealValues, setShowDealValues] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const funnelRef = useRef<HTMLDivElement>(null);

  const isAdmin = isTeamOwnerEmail(user?.email);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      funnelRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const parkedLists = useMemo(() => lists.filter((l) => l.stage === "parked"), [lists]);
  const funnelLists = useMemo(() => lists.filter((l) => l.stage !== "parked"), [lists]);

  const pipelineRevenue = useMemo(
    () => funnelLists.reduce((sum, l) => sum + (l.deal_value ?? 0), 0),
    [funnelLists]
  );

  const formattedRevenue = pipelineRevenue > 0
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(pipelineRevenue)
    : null;

  const listsByStage = useMemo(
    () =>
      STAGES.reduce((acc, stage) => {
        acc[stage] = funnelLists
          .filter((l) => l.stage === stage)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return acc;
      }, {} as Record<ListStage, List[]>),
    [funnelLists]
  );

  const totalPending = myStats?.pending ?? 0;
  const totalMinutes = myStats?.minutes ?? 0;

  function handleDragStart(event: DragStartEvent) {
    const list = event.active.data.current?.list as List | undefined;
    if (list) setActiveList(list);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    const list = active.data.current?.list as List | undefined;
    if (!list || !over) { setActiveList(null); return; }

    const overId = String(over.id);

    // Dropped on a stage column (empty droppable zone)
    if (STAGES.includes(overId as ListStage)) {
      const nextStage = overId as ListStage;
      if (nextStage !== list.stage) {
        const stagePatch: { stage: ListStage; management_started_at?: string; revision_version?: import("@/types/tasks").RevisionVersion } = { stage: nextStage };
        if (nextStage === "management" && !list.management_started_at) {
          stagePatch.management_started_at = new Date().toISOString();
        }
        if (nextStage === "revisions" && !list.revision_version) {
          stagePatch.revision_version = "v1_sent";
        }
        updateList.mutate({ id: list.id, patch: stagePatch });
        if (nextStage === "completed") fireConfetti();
      }
      setActiveList(null);
      return;
    }

    // Dropped on another card
    const overList = lists.find((l) => l.id === overId);
    if (!overList) { setActiveList(null); return; }

    if (overList.stage !== list.stage) {
      // Cross-column move
      const nextStage = overList.stage as ListStage;
      const stagePatch: { stage: ListStage; management_started_at?: string; revision_version?: import("@/types/tasks").RevisionVersion } = { stage: nextStage };
      if (nextStage === "management" && !list.management_started_at) {
        stagePatch.management_started_at = new Date().toISOString();
      }
      if (nextStage === "revisions" && !list.revision_version) {
        stagePatch.revision_version = "v1_sent";
      }
      updateList.mutate({ id: list.id, patch: stagePatch });
      if (nextStage === "completed") fireConfetti();
    } else {
      // Within-column reorder
      const stageItems = listsByStage[list.stage as ListStage];
      const oldIndex = stageItems.findIndex((l) => l.id === list.id);
      const newIndex = stageItems.findIndex((l) => l.id === overList.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(stageItems, oldIndex, newIndex);
        reorderLists.mutate(reordered.map((l, i) => ({ id: l.id, sort_order: i })));
      }
    }

    setActiveList(null);
  }

  function fireConfetti() {
    const burst = (opts: confetti.Options) => confetti({ particleCount: 80, spread: 70, ...opts });
    burst({ origin: { x: 0.3, y: 0.5 } });
    burst({ origin: { x: 0.7, y: 0.5 } });
    setTimeout(() => burst({ origin: { x: 0.5, y: 0.3 }, particleCount: 60 }), 150);
  }

  return (
    <div className="flex flex-col gap-5 h-full w-full pb-5">
      {/* Greeting header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">{getGreeting()}, {user?.full_name?.split(' ')[0] ?? 'there'}</h1>
          <p className="text-sm text-[#8888AA] mt-1">
            {totalPending > 0 ? (
              <>
                <span className="text-white font-medium">{totalPending}</span> tasks assigned to you
                {totalMinutes > 0 && (
                  <> · <span className="text-white font-medium">{formatMinutes(totalMinutes)}</span> estimated</>
                )}
              </>
            ) : (
              <span className="text-emerald-400">All caught up — nice work.</span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingList(null);
            setCreateStage("new_project");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </button>
      </div>

      {/* Two-tile layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: My Lists tile */}
        <ParkedListsPanel
          lists={parkedLists}
          onCreateNew={() => {
            setEditingList(null);
            setCreateStage("parked");
          }}
          onEditList={(list) => {
            setCreateStage(null);
            setEditingList(list);
          }}
        />

        {/* Right: Project Funnel tile */}
        <div ref={funnelRef} className={`flex-1 flex flex-col rounded-2xl border border-white/[0.08] overflow-hidden min-h-0 min-w-0 ${isFullscreen ? "bg-[#0D0D18]" : "bg-white/[0.03]"}`}>
          {/* Tile header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8888AA]">Project Funnel</span>
              {isAdmin && formattedRevenue && showDealValues && (
                <span className="text-xs font-semibold text-emerald-400">{formattedRevenue}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowDealValues((v) => !v)}
                  className="flex items-center gap-1.5 text-[11px] text-[#8888AA] hover:text-white transition-colors"
                  title={showDealValues ? "Hide deal values" : "Show deal values"}
                >
                  {showDealValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showDealValues ? "Hide values" : "Show values"}</span>
                </button>
              )}
              <span className="text-[11px] text-[#8888AA]">
                {funnelLists.length} {funnelLists.length === 1 ? "list" : "lists"}
              </span>
              <button
                onClick={toggleFullscreen}
                className="text-[#8888AA] hover:text-white transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Board */}
          <div className="flex-1 overflow-x-auto p-4 min-h-0">
            {isLoading ? (
              <div className="flex gap-4">
                {STAGES.map((s) => (
                  <div
                    key={s}
                    className="w-[280px] flex-shrink-0 animate-pulse bg-white/[0.04] rounded-xl h-48"
                  />
                ))}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 h-full">
                  {STAGES.map((stage) => (
                    <ListKanbanColumn
                      key={stage}
                      stage={stage}
                      lists={listsByStage[stage]}
                      onEditList={(list) => {
                        setCreateStage(null);
                        setEditingList(list);
                      }}
                      isAdmin={isAdmin}
                      showDealValues={showDealValues}
                    />
                  ))}
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeList && <ListKanbanCard list={activeList} isOverlay isAdmin={isAdmin} showDealValues={showDealValues} />}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      <CreateListModal
        open={createStage !== null || editingList !== null}
        onClose={() => {
          setCreateStage(null);
          setEditingList(null);
        }}
        defaultStage={editingList?.stage ?? createStage ?? "pre_production"}
        editingList={editingList}
      />
    </div>
  );
}
