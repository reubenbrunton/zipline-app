"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ListKanbanCard } from "./ListKanbanCard";
import type { List, ListStage } from "@/types/tasks";

const STAGE_CONFIG: Record<ListStage, { label: string; color: string }> = {
  new_project:     { label: "New Project",           color: "#8888AA" },
  strategy:        { label: "Strategy",              color: "#6366F1" },
  scripting:       { label: "Scripting",             color: "#A855F7" },
  production:      { label: "Production",            color: "#3B82F6" },
  post_production: { label: "Post Production",       color: "#F59E0B" },
  revisions:       { label: "Revisions / Feedback",  color: "#FF4533" },
  media_buying:    { label: "Media Buying",          color: "#38BDF8" },
  management:      { label: "Management",            color: "#EC4899" },
  completed:       { label: "Project Completed",     color: "#10B981" },
  parked:          { label: "Parked",                color: "#6B7280" },
  pre_production:  { label: "Pre Production",        color: "#8888AA" }, // legacy
};

interface ListKanbanColumnProps {
  stage: ListStage;
  lists: List[];
  onEditList?: (list: List) => void;
  isAdmin?: boolean;
  showDealValues?: boolean;
}

export function ListKanbanColumn({ stage, lists, onEditList, isAdmin, showDealValues }: ListKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const config = STAGE_CONFIG[stage];

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
        <span className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider flex-1">
          {config.label}
        </span>
        {/* Count badge */}
        <AnimatePresence mode="wait">
          <motion.span
            key={lists.length}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="text-xs font-semibold text-[#8888AA] bg-white/[0.06] rounded-full w-5 h-5 flex items-center justify-center"
          >
            {lists.length}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Card list — droppable zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-xl p-2 transition-colors duration-150 min-h-[120px]",
          isOver ? "bg-white/[0.04]" : "bg-transparent"
        )}
      >
        <SortableContext items={lists.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence mode="popLayout" initial={false}>
          {lists.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="border border-dashed border-white/[0.08] rounded-xl p-6 flex items-center justify-center"
            >
              <p className="text-xs text-[#8888AA]/50">No lists</p>
            </motion.div>
          )}
          {lists.map((list) => (
            <motion.div
              key={list.id}
              layout="position"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
              transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
            >
              <ListKanbanCard list={list} onEdit={onEditList} isAdmin={isAdmin} showDealValues={showDealValues} />
            </motion.div>
          ))}
        </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
}
