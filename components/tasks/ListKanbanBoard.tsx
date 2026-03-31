"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { formatMinutes } from "@/lib/tasks-mock";
import { useLists, useUpdateList, useMyStats } from "@/hooks/tasks";
import { ListKanbanColumn } from "./ListKanbanColumn";
import { ListKanbanCard } from "./ListKanbanCard";
import { CreateListModal } from "./CreateListModal";
import { ParkedListsPanel } from "./ParkedListsPanel";
import type { List, ListStage } from "@/types/tasks";

const STAGES: ListStage[] = [
  "pre_production",
  "production",
  "post_production",
  "revisions",
  "media_buying",
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
  const { data: myStats } = useMyStats("user-jordan");
  const [activeList, setActiveList] = useState<List | null>(null);
  const [createStage, setCreateStage] = useState<ListStage | null>(null);
  const [editingList, setEditingList] = useState<List | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const parkedLists = useMemo(() => lists.filter((l) => l.stage === "parked"), [lists]);
  const funnelLists = useMemo(() => lists.filter((l) => l.stage !== "parked"), [lists]);

  const listsByStage = useMemo(
    () =>
      STAGES.reduce((acc, stage) => {
        acc[stage] = funnelLists.filter((l) => l.stage === stage);
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
    if (over && list && over.id !== list.stage) {
      updateList.mutate({ id: list.id, patch: { stage: over.id as ListStage } });
    }
    setActiveList(null);
  }

  return (
    <div className="flex flex-col gap-5 h-full w-full pb-5">
      {/* Greeting header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">{getGreeting()}, Reuben</h1>
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
            setCreateStage("pre_production");
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
        <div className="flex-1 flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden min-h-0 min-w-0">
          {/* Tile header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8888AA]">Project Funnel</span>
            <span className="text-[11px] text-[#8888AA]">
              {funnelLists.length} {funnelLists.length === 1 ? "list" : "lists"}
            </span>
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
                collisionDetection={closestCorners}
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
                    />
                  ))}
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeList && <ListKanbanCard list={activeList} isOverlay />}
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
