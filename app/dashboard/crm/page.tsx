"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  User,
  Phone,
  Mail,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { crmContacts, pipeline } from "@/lib/mock-data";

const DEFAULT_WIDTHS = [220, 180, 160, 220, 160, 140];
const MAX_WIDTHS = [430, 390, 410, 460, 390, 360];

type CRMContact = (typeof crmContacts)[number];
type PipelineStage = (typeof pipeline)[number]["stage"];

const PIPELINE_STAGES = pipeline.map((stage) => stage.stage);

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  "Active Client": { bg: "rgba(16,185,129,0.12)", text: "#10B981", dot: "#10B981" },
  "Onboarding": { bg: "rgba(99,102,241,0.12)", text: "#818CF8", dot: "#818CF8" },
  Proposal: { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B" },
  Lead: { bg: "rgba(136,136,170,0.12)", text: "#8888AA", dot: "#8888AA" },
};

type View = "dashboard" | "contacts" | "onboarding-funnel";
const VIEW_ORDER: View[] = ["dashboard", "contacts", "onboarding-funnel"];

const tabBg = "bg-white/[0.06] rounded-lg p-1 flex items-center gap-0.5";
const tabBtn = (active: boolean) =>
  cn(
    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap",
    active ? "bg-[#FF4533] text-white shadow-sm" : "text-white/50 hover:text-white/80"
  );

function isPipelineStage(value: string): value is PipelineStage {
  return PIPELINE_STAGES.includes(value);
}

function CopyField({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="group/copy flex items-center gap-2 overflow-visible cursor-pointer relative"
      onClick={handleCopy}
    >
      <Icon className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
      <span className="text-xs text-white/60 truncate flex-1">{value}</span>
      {!copied && (
        <Copy className="h-3 w-3 text-white/20 flex-shrink-0 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
      )}
      <AnimatePresence>
        {copied && (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium pointer-events-none"
          >
            <Check className="h-2.5 w-2.5" />
            Copied
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function useColumnResize(defaultWidths: number[]) {
  const [widths, setWidths] = useState(defaultWidths);
  const dragging = useRef<{ col: number; startX: number; startW: number } | null>(null);

  const onMouseDown = useCallback(
    (col: number, e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = { col, startX: e.clientX, startW: widths[col] };

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = ev.clientX - dragging.current.startX;
        const newW = Math.min(
          MAX_WIDTHS[dragging.current.col],
          Math.max(80, dragging.current.startW + delta)
        );
        setWidths((prev) => {
          const next = [...prev];
          next[dragging.current!.col] = newW;
          return next;
        });
      };
      const onUp = () => {
        dragging.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [widths]
  );

  return { widths, onMouseDown };
}

interface FunnelCardProps {
  contact: CRMContact;
  stageColor: string;
  isOverlay?: boolean;
}

function FunnelCard({ contact, stageColor, isOverlay }: FunnelCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `crm-contact-${contact.id}`,
    data: { contact },
    disabled: isOverlay,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-4 mb-2 min-h-[120px]"
      />
    );
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : { ...listeners, ...attributes })}
      className={cn(
        "rounded-xl bg-white/[0.07] backdrop-blur-xl p-4 border border-white/[0.08] mb-2 cursor-grab",
        "hover:bg-white/[0.11] hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/20 transition-all duration-150",
        isOverlay && "rotate-2 shadow-2xl opacity-90"
      )}
    >
      <div className="h-1 rounded-full mb-3" style={{ backgroundColor: stageColor }} />

      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: contact.logoColor }}
        >
          {contact.logoInitials}
        </div>
        <span className="text-sm font-semibold text-white truncate">{contact.company}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <User className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          <span className="text-xs text-white/60 truncate">{contact.contact}</span>
        </div>
        <CopyField icon={Phone} value={contact.phone} />
        <CopyField icon={Mail} value={contact.email} />
        <a
          href={`https://${contact.website}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 overflow-hidden group/web hover:text-white/90 transition-colors"
        >
          <Globe className="h-3.5 w-3.5 text-white/30 flex-shrink-0 group-hover/web:text-white/60 transition-colors" />
          <span className="text-xs text-white/60 truncate group-hover/web:underline">
            {contact.website}
          </span>
        </a>
      </div>

      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex flex-wrap gap-1.5">
          {contact.tags.map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                borderColor: `${tag.color}40`,
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface FunnelColumnProps {
  stage: PipelineStage;
  color: string;
  contacts: CRMContact[];
  droppedContact: { id: number; yOffset: number } | null;
}

function FunnelColumn({ stage, color, contacts, droppedContact }: FunnelColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="w-72 flex-shrink-0 self-start h-fit flex flex-col rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.14] p-3">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-white truncate flex-1">{stage}</span>
        <motion.span
          key={contacts.length}
          initial={{ scale: 1.4, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.08] text-white"
        >
          {contacts.length}
        </motion.span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "rounded-lg p-1 transition-colors duration-150 min-h-[120px]",
          isOver ? "bg-white/[0.04]" : "bg-transparent"
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {contacts.length === 0 && (
            <motion.div
              key={`empty-${stage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="border border-dashed border-white/[0.08] rounded-xl p-4 text-center"
            >
              <p className="text-xs text-[#8888AA]">No clients</p>
            </motion.div>
          )}

          {contacts.map((contact) => {
            const isDropped = droppedContact?.id === contact.id;
            return (
              <motion.div
                key={contact.id}
                layout
                initial={
                  isDropped
                    ? { opacity: 0.85, y: droppedContact!.yOffset, scale: 1 }
                    : { opacity: 0, y: -12, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
              >
                <FunnelCard contact={contact} stageColor={color} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [view, setView] = useState<View>("contacts");
  const [dir, setDir] = useState(1);
  const [funnelContacts, setFunnelContacts] = useState<CRMContact[]>(() =>
    crmContacts.map((contact) => ({
      ...contact,
      tags: contact.tags ? [...contact.tags] : [],
    }))
  );
  const [activeFunnelContact, setActiveFunnelContact] = useState<CRMContact | null>(null);
  const [droppedFunnelContact, setDroppedFunnelContact] = useState<{
    id: number;
    yOffset: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { widths, onMouseDown } = useColumnResize(DEFAULT_WIDTHS);
  const columns = ["Company", "Lead Contact", "Phone", "Email", "Website", "Status"];

  const stageCounts = useMemo(() => {
    return pipeline.reduce<Record<string, number>>((acc, stage) => {
      acc[stage.stage] = funnelContacts.filter(
        (contact) => contact.pipelineStage === stage.stage
      ).length;
      return acc;
    }, {});
  }, [funnelContacts]);

  const maxStageCount = useMemo(() => Math.max(1, ...Object.values(stageCounts)), [stageCounts]);

  const navigate = (next: View) => {
    setDir(VIEW_ORDER.indexOf(next) > VIEW_ORDER.indexOf(view) ? 1 : -1);
    setView(next);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -40, opacity: 0 }),
  };

  function handleFunnelDragStart(event: DragStartEvent) {
    const contact = event.active.data.current?.contact as CRMContact | undefined;
    if (contact) setActiveFunnelContact(contact);
  }

  function handleFunnelDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    if (!activeFunnelContact) {
      setActiveFunnelContact(null);
      return;
    }

    if (!over) {
      setActiveFunnelContact(null);
      return;
    }

    const nextStageId = String(over.id);
    if (!isPipelineStage(nextStageId)) {
      setActiveFunnelContact(null);
      return;
    }

    if (nextStageId !== activeFunnelContact.pipelineStage) {
      const translatedRect = active.rect.current.translated;
      const overRect = over.rect;
      const rawOffset = translatedRect && overRect ? translatedRect.top - overRect.top : -16;
      const yOffset = Math.max(-400, Math.min(400, rawOffset));

      setDroppedFunnelContact({ id: activeFunnelContact.id, yOffset });
      setTimeout(() => setDroppedFunnelContact(null), 600);

      setFunnelContacts((prev) =>
        prev.map((contact) =>
          contact.id === activeFunnelContact.id
            ? { ...contact, pipelineStage: nextStageId }
            : contact
        )
      );
    }

    setActiveFunnelContact(null);
  }

  const activeFunnelColor =
    activeFunnelContact
      ? pipeline.find((stage) => stage.stage === activeFunnelContact.pipelineStage)?.color ??
      "#8888AA"
      : "#8888AA";

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">CRM / Clients</h2>
          <p className="text-sm text-white mt-0.5">Manage contacts and track your sales pipeline</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className={tabBg}>
          <button
            onClick={() => navigate("dashboard")}
            className={cn(tabBtn(view === "dashboard"), "flex items-center gap-1.5")}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </button>
        </div>

        <div className="w-px h-5 bg-white/[0.10]" />

        <div className={tabBg}>
          <button onClick={() => navigate("contacts")} className={tabBtn(view === "contacts")}>
            Contacts
          </button>
          <button
            onClick={() => navigate("onboarding-funnel")}
            className={tabBtn(view === "onboarding-funnel")}
          >
            Onboarding Funnel
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={view}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {view === "dashboard" && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Clients", value: String(funnelContacts.length), sub: "+3 this month", icon: Users, color: "#6366F1" },
                    { label: "Active Revenue", value: "$48,200", sub: "Monthly recurring", icon: DollarSign, color: "#10B981" },
                    { label: "In Onboarding", value: String(stageCounts["Onboarding"] ?? 0), sub: "Avg 12 days", icon: TrendingUp, color: "#F59E0B" },
                    { label: "Open Proposals", value: "5", sub: "$96,000 pipeline", icon: TrendingUp, color: "#FF4533" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl bg-white/[0.07] backdrop-blur-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-white/50 font-medium">{kpi.label}</span>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${kpi.color}22` }}
                        >
                          <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">{kpi.value}</p>
                      <p className="text-xs text-white/40 mt-1">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 rounded-xl bg-white/[0.07] backdrop-blur-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Recent Clients</h3>
                    <div className="flex flex-col gap-2">
                      {funnelContacts.slice(0, 4).map((c) => {
                        const s = statusStyles[c.status] ?? statusStyles.Lead;
                        return (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0"
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: c.logoColor }}
                            >
                              {c.logoInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{c.company}</p>
                              <p className="text-xs text-white/40 truncate">{c.contact}</p>
                            </div>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: s.bg, color: s.text }}
                            >
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: s.dot }} />
                              {c.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.07] backdrop-blur-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Stage Breakdown</h3>
                    <div className="flex flex-col gap-3">
                      {pipeline.map((stage) => {
                        const count = stageCounts[stage.stage] ?? 0;
                        return (
                          <div key={stage.stage}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-white/70">{stage.stage}</span>
                              <span className="text-xs font-semibold text-white">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(count / maxStageCount) * 100}%`,
                                  backgroundColor: stage.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === "contacts" && (
              <div className="flex flex-col gap-4">
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60 pointer-events-none" />
                  <input
                    placeholder="Search contacts..."
                    className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.07] text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
                  />
                </div>

                <div className="rounded-xl bg-white/[0.07] backdrop-blur-xl overflow-x-auto">
                  <table className="border-collapse" style={{ width: widths.reduce((a, b) => a + b, 0) }}>
                    <colgroup>
                      {widths.map((w, i) => (
                        <col key={i} style={{ width: w }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {columns.map((col, i) => (
                          <th
                            key={col}
                            className="text-left text-xs font-semibold text-white uppercase tracking-wider py-3.5 relative select-none"
                            style={{ paddingLeft: i === 0 ? 20 : 16, paddingRight: 16 }}
                          >
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis block">
                              {col}
                            </span>
                            <div
                              className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-col-resize group z-10"
                              onMouseDown={(e) => onMouseDown(i, e)}
                            >
                              <div className="w-px h-4 bg-white/[0.15] group-hover:bg-white/40 group-hover:h-full transition-all" />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {funnelContacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer last:border-0"
                        >
                          <td className="px-5 py-4" style={{ width: widths[0] }}>
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: contact.logoColor }}
                              >
                                {contact.logoInitials}
                              </div>
                              <span className="text-sm font-semibold text-white truncate">
                                {contact.company}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 overflow-hidden" style={{ width: widths[1] }}>
                            <span className="text-sm text-white/80 truncate block">{contact.contact}</span>
                          </td>
                          <td className="px-4 py-4 overflow-hidden" style={{ width: widths[2] }}>
                            <span className="text-sm text-white/80 truncate block">{contact.phone}</span>
                          </td>
                          <td className="px-4 py-4 overflow-hidden" style={{ width: widths[3] }}>
                            <span className="text-sm text-white/60 truncate block">{contact.email}</span>
                          </td>
                          <td className="px-4 py-4 overflow-hidden" style={{ width: widths[4] }}>
                            <span className="text-sm text-white/60 truncate block">{contact.website}</span>
                          </td>
                          <td className="px-4 py-4 overflow-hidden" style={{ width: widths[5] }}>
                            {(() => {
                              const s = statusStyles[contact.status] ?? statusStyles.Lead;
                              return (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                                  style={{ background: s.bg, color: s.text }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: s.dot }}
                                  />
                                  {contact.status}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === "onboarding-funnel" && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleFunnelDragStart}
                onDragEnd={handleFunnelDragEnd}
              >
                <div className="overflow-x-auto pb-4">
                  <div className="flex items-start gap-4" style={{ minWidth: pipeline.length * 300 }}>
                    {pipeline.map((stage) => {
                      const stageContacts = funnelContacts.filter(
                        (contact) => contact.pipelineStage === stage.stage
                      );
                      return (
                        <FunnelColumn
                          key={stage.stage}
                          stage={stage.stage}
                          color={stage.color}
                          contacts={stageContacts}
                          droppedContact={droppedFunnelContact}
                        />
                      );
                    })}
                  </div>
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeFunnelContact && (
                    <FunnelCard
                      contact={activeFunnelContact}
                      stageColor={activeFunnelColor}
                      isOverlay
                    />
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
