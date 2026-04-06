"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
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
  X,
  Trash2,
  MoreHorizontal,
  FolderKanban,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  useCRMContacts,
  useCreateCRMContact,
  useUpdateCRMContact,
  useDeleteCRMContact,
} from "@/hooks/crm";
import {
  PIPELINE_STAGES,
  type CRMContact,
  type PipelineStage,
} from "@/types/crm";
import { ClientDetailModal } from "@/components/crm/ClientDetailModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateListModal } from "@/components/tasks/CreateListModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_WIDTHS = [240, 180, 160, 220, 140, 120];
const MAX_WIDTHS    = [430, 390, 410, 460, 360, 200];

function formatCurrency(value: number | undefined): string {
  if (!value) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function parseCurrency(raw: string): number | undefined {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? undefined : n
}

type View = "dashboard" | "contacts" | "pipeline";
const VIEW_ORDER: View[] = ["dashboard", "contacts", "pipeline"];

const tabBg = "bg-white/[0.06] rounded-lg p-1 flex items-center gap-0.5";
const tabBtn = (active: boolean) =>
  cn(
    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap",
    active ? "bg-[#FF4533] text-white shadow-sm" : "text-white/50 hover:text-white/80"
  );

const LOGO_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#FF4533", "#FF8C00", "#06B6D4", "#EC4899", "#14B8A6",
  "#3B82F6", "#A855F7",
];

function isPipelineStage(value: string): value is PipelineStage {
  return PIPELINE_STAGES.some((s) => s.stage === value);
}

// ---------------------------------------------------------------------------
// Stage Breakdown Chart
// ---------------------------------------------------------------------------
interface StageBreakdownChartProps {
  stageCounts: Record<string, number>;
  maxStageCount: number;
}

function StageBreakdownChart({ stageCounts }: StageBreakdownChartProps) {
  const SHORT_LABEL: Record<string, string> = {
    "Strategy Call Booked": "Call Booked",
  };

  const data = PIPELINE_STAGES.map((s) => ({
    stage: s.stage,
    label: SHORT_LABEL[s.stage] ?? s.stage,
    count: stageCounts[s.stage] ?? 0,
    color: s.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as (typeof data)[number];
            return (
              <div className="rounded-lg bg-white/[0.10] backdrop-blur-xl border border-white/[0.12] px-3 py-2 text-xs shadow-xl">
                <p className="font-semibold text-white mb-0.5">{d.stage}</p>
                <p style={{ color: d.color }}>{d.count} contact{d.count !== 1 ? "s" : ""}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.stage} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// CopyField
// ---------------------------------------------------------------------------
function CopyField({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group/copy flex items-center gap-2 overflow-visible cursor-pointer relative" onClick={handleCopy}>
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

// ---------------------------------------------------------------------------
// Column resize hook
// ---------------------------------------------------------------------------
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
        const newW = Math.min(MAX_WIDTHS[dragging.current.col], Math.max(80, dragging.current.startW + delta));
        setWidths((prev) => { const next = [...prev]; next[dragging.current!.col] = newW; return next; });
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

// ---------------------------------------------------------------------------
// Pipeline funnel card
// ---------------------------------------------------------------------------
interface FunnelCardProps {
  contact: CRMContact;
  stageColor: string;
  isOverlay?: boolean;
  onDelete: (id: string) => void;
  onOpenDetail: (contact: CRMContact) => void;
  onStartProject: (contact: CRMContact) => void;
  onUpdateDealValue: (id: string, value: number | undefined) => void;
  onRemoveFromPipeline: (id: string) => void;
}

function FunnelCard({ contact, stageColor, isOverlay, onDelete, onOpenDetail, onStartProject, onUpdateDealValue, onRemoveFromPipeline }: FunnelCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `crm-contact-${contact.id}`,
    data: { contact },
    disabled: isOverlay,
  });

  const [editingDeal, setEditingDeal] = useState(false);
  const [dealRaw, setDealRaw] = useState("");

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-4 mb-2 min-h-[100px]"
      />
    );
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : { ...listeners, ...attributes })}
      className={cn(
        "rounded-xl bg-white/[0.07] backdrop-blur-xl p-4 border border-white/[0.08] mb-2 cursor-grab group/card",
        "hover:bg-white/[0.11] hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/20 transition-all duration-150",
        isOverlay && "rotate-2 shadow-2xl opacity-90"
      )}
    >
      <div className="h-1 rounded-full mb-3" style={{ backgroundColor: stageColor }} />

      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: contact.logo_color }}
        >
          {contact.logo_initials}
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onOpenDetail(contact); }}
          className="text-sm font-semibold text-white truncate flex-1 text-left hover:text-white/80 transition-colors"
        >
          {contact.company}
        </button>
        {!isOverlay && (
          <div className="relative flex-shrink-0" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover/card:opacity-100 flex items-center justify-center w-5 h-5 rounded text-white/40 hover:text-white/80 transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onStartProject(contact)} className="gap-2 text-xs">
                  <FolderKanban className="w-3 h-3" />
                  Start Project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onRemoveFromPipeline(contact.id)} className="gap-2 text-xs">
                  <X className="w-3 h-3" />
                  Remove from pipeline
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onDelete(contact.id)} className="gap-2 text-xs text-red-400 focus:text-red-400">
                  <Trash2 className="w-3 h-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {contact.contact && (
          <div className="flex items-center gap-2 overflow-hidden">
            <User className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
            <span className="text-xs text-white/60 truncate">{contact.contact}</span>
          </div>
        )}
        {contact.phone    && <CopyField icon={Phone} value={contact.phone} />}
        {contact.email    && <CopyField icon={Mail}  value={contact.email} />}
        {contact.website  && (
          <a
            href={`https://${contact.website}`}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 overflow-hidden group/web hover:text-white/90 transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-white/30 flex-shrink-0 group-hover/web:text-white/60 transition-colors" />
            <span className="text-xs text-white/60 truncate group-hover/web:underline">{contact.website}</span>
          </a>
        )}
      </div>

      {/* Inline deal value */}
      <div className="mt-3 pt-3 border-t border-white/[0.05]">
        {editingDeal ? (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-emerald-400/70 flex-shrink-0" />
            <input
              autoFocus
              value={dealRaw}
              onChange={(e) => setDealRaw(e.target.value)}
              onBlur={() => {
                const parsed = parseCurrency(dealRaw);
                onUpdateDealValue(contact.id, parsed);
                setEditingDeal(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") { setEditingDeal(false); }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Enter amount"
              inputMode="numeric"
              className="flex-1 min-w-0 bg-transparent border-b border-emerald-400/40 text-xs font-semibold text-emerald-400 focus:outline-none placeholder:text-white/30"
            />
          </div>
        ) : (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setDealRaw(contact.deal_value ? String(contact.deal_value) : "");
              setEditingDeal(true);
            }}
            className="flex items-center gap-1.5 w-full group/deal"
          >
            <DollarSign className="h-3 w-3 text-emerald-400/70 flex-shrink-0" />
            <span className={cn("text-xs font-semibold", contact.deal_value ? "text-emerald-400" : "text-white/20 group-hover/deal:text-white/40 transition-colors")}>
              {contact.deal_value ? formatCurrency(contact.deal_value) : "Add deal value"}
            </span>
          </button>
        )}
      </div>

      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex flex-wrap gap-1.5">
          {contact.tags.map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
              style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}40` }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {contact.pipeline_stage === "Onboarded" && !isOverlay && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onStartProject(contact); }}
          className="mt-3 w-full py-2 rounded-lg bg-[#FF4533] hover:bg-[#e03d2d] active:scale-[0.98] text-white text-xs font-bold tracking-wide transition-all"
        >
          Start a Project
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline funnel column
// ---------------------------------------------------------------------------
interface FunnelColumnProps {
  stage: string;
  color: string;
  contacts: CRMContact[];
  droppedContact: { id: string; yOffset: number } | null;
  onDelete: (id: string) => void;
  onOpenDetail: (contact: CRMContact) => void;
  onStartProject: (contact: CRMContact) => void;
  onUpdateDealValue: (id: string, value: number | undefined) => void;
  onRemoveFromPipeline: (id: string) => void;
}

function FunnelColumn({ stage, color, contacts, droppedContact, onDelete, onOpenDetail, onStartProject, onUpdateDealValue, onRemoveFromPipeline }: FunnelColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageTotal = contacts.reduce((sum, c) => sum + (c.deal_value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 flex-shrink-0 self-start flex flex-col rounded-xl backdrop-blur-xl border p-3 transition-colors duration-150",
        isOver ? "bg-white/[0.08] border-white/[0.16]" : "bg-white/[0.04] border-white/[0.08]"
      )}
    >
      <div className="flex items-center gap-2 mb-1 px-1">
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
      {stageTotal > 0 && (
        <p className="text-[11px] text-emerald-400/80 font-medium px-1 mb-2">{formatCurrency(stageTotal)}</p>
      )}

      <div className="rounded-lg p-1 min-h-[100px]">
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
              <p className="text-xs text-white/30">No contacts</p>
            </motion.div>
          )}
          {contacts.map((contact) => {
            const isDropped = droppedContact?.id === contact.id;
            return (
              <motion.div
                key={contact.id}
                layout
                initial={isDropped ? { opacity: 0.85, y: droppedContact!.yOffset, scale: 1 } : { opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.8 }}
              >
                <FunnelCard contact={contact} stageColor={color} onDelete={onDelete} onOpenDetail={onOpenDetail} onStartProject={onStartProject} onUpdateDealValue={onUpdateDealValue} onRemoveFromPipeline={onRemoveFromPipeline} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Contact modal
// ---------------------------------------------------------------------------
interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    company: string;
    logo_color: string;
    contact?: string;
    phone?: string;
    email?: string;
    website?: string;
    pipeline_stage: string | null;
    service?: string;
    location?: string;
    deal_value?: number;
  }) => void;
  saving: boolean;
}

function AddContactModal({ open, onClose, onSubmit, saving }: AddContactModalProps) {
  const [company,        setCompany]       = useState("");
  const [contact,        setContact]       = useState("");
  const [phone,          setPhone]         = useState("");
  const [email,          setEmail]         = useState("");
  const [website,        setWebsite]       = useState("");
  const [service,        setService]       = useState("");
  const [dealValueRaw,   setDealValueRaw]  = useState("");
  const [location,       setLocation]      = useState("");
  const [pipeline_stage, setPipelineStage] = useState("");
  const [logo_color,     setLogoColor]     = useState(LOGO_COLORS[0]);

  const reset = () => {
    setCompany(""); setContact(""); setPhone(""); setEmail("");
    setWebsite(""); setService(""); setDealValueRaw(""); setLocation(""); setPipelineStage(""); setLogoColor(LOGO_COLORS[0]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;
    onSubmit({
      company: company.trim(),
      logo_color,
      contact:     contact.trim()     || undefined,
      phone:       phone.trim()       || undefined,
      email:       email.trim()       || undefined,
      website:     website.trim()     || undefined,
      pipeline_stage: pipeline_stage,
      service:     service.trim()     || undefined,
      location:    location.trim()    || undefined,
      deal_value:  parseCurrency(dealValueRaw),
    });
    reset();
  };

  const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors";
  const labelCls = "text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-white/[0.07] border-white/[0.08] backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Company + colour */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Company *</label>
              <input
                className={inputCls}
                placeholder="Acme Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Colour</label>
              <div className="flex flex-wrap gap-1.5 mt-1 w-[88px]">
                {LOGO_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLogoColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-md transition-all",
                      logo_color === c ? "ring-2 ring-white/60 ring-offset-1 ring-offset-transparent scale-110" : "opacity-60 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Contact person</label>
              <input className={inputCls} placeholder="Jane Smith" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Service</label>
              <input className={inputCls} placeholder="Social Media" value={service} onChange={(e) => setService(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" placeholder="jane@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Website</label>
              <input className={inputCls} placeholder="acme.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input className={inputCls} placeholder="Queenstown" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Onboarding Pipeline</label>
              <select
                className={cn(inputCls, "cursor-pointer")}
                value={pipeline_stage}
                onChange={(e) => setPipelineStage(e.target.value)}
              >
                <option value="">None</option>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.stage} value={s.stage}>{s.stage}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Deal value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
                <input
                  className={cn(inputCls, "pl-6")}
                  placeholder="5,000"
                  value={dealValueRaw}
                  onChange={(e) => setDealValueRaw(e.target.value)}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!company.trim() || saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Add Contact"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CRMPage() {
  const { data: contacts = [], isLoading } = useCRMContacts();

  const createContact = useCreateCRMContact();
  const updateContact = useUpdateCRMContact();
  const deleteContact = useDeleteCRMContact();

  const [view,              setView]             = useState<View>("dashboard");
  const [dir,               setDir]              = useState(1);
  const [search,            setSearch]           = useState("");
  const [addOpen,           setAddOpen]          = useState(false);
  const [activeContact,     setActiveContact]    = useState<CRMContact | null>(null);
  const [droppedContact,    setDroppedContact]   = useState<{ id: string; yOffset: number } | null>(null);
  const [recentlyMovedId,   setRecentlyMovedId]  = useState<string | null>(null);
  const movedAtRef = useRef<Map<string, number>>(new Map());
  const [selectedContact,   setSelectedContact]  = useState<CRMContact | null>(null);
  const [startProjectOpen,  setStartProjectOpen] = useState(false);
  const [startProjectClient, setStartProjectClient] = useState<string | undefined>(undefined);
  const [pendingRemoveId,   setPendingRemoveId]   = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { widths, onMouseDown } = useColumnResize(DEFAULT_WIDTHS);
  const columns = ["Company", "Contact", "Phone", "Email", "Website", "Deal Value"];

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.contact?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const stageCounts = useMemo(
    () =>
      PIPELINE_STAGES.reduce<Record<string, number>>((acc, s) => {
        acc[s.stage] = contacts.filter((c) => c.pipeline_stage === s.stage).length;
        return acc;
      }, {}),
    [contacts]
  );

  const maxStageCount = useMemo(() => Math.max(1, ...Object.values(stageCounts)), [stageCounts]);

  const totalPipelineValue = useMemo(
    () => contacts.reduce((sum, c) => sum + (c.deal_value ?? 0), 0),
    [contacts]
  );

  // Contacts per stage — recently moved first (by timestamp), then newest created_at
  const contactsByStage = useMemo(() => {
    const result: Record<string, CRMContact[]> = {};
    for (const s of PIPELINE_STAGES) {
      result[s.stage] = contacts
        .filter((c) => c.pipeline_stage === s.stage)
        .sort((a, b) => {
          const ma = movedAtRef.current.get(a.id) ?? 0;
          const mb = movedAtRef.current.get(b.id) ?? 0;
          if (mb !== ma) return mb - ma; // most recently moved first
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }
    return result;
  }, [contacts, recentlyMovedId]);

  const navigate = (next: View) => {
    setDir(VIEW_ORDER.indexOf(next) > VIEW_ORDER.indexOf(view) ? 1 : -1);
    setView(next);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d * -40, opacity: 0 }),
  };

  function handleDragStart(event: DragStartEvent) {
    const contact = event.active.data.current?.contact as CRMContact | undefined;
    if (contact) setActiveContact(contact);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    if (!activeContact) { setActiveContact(null); return; }
    if (!over)          { setActiveContact(null); return; }

    // over.id may be a stage name (dropped on column) or a card id (dropped on another card)
    let nextStage = String(over.id);
    if (!isPipelineStage(nextStage)) {
      // dropped on a card — derive stage from that card's data or look it up
      const overContactId = nextStage.startsWith("crm-contact-")
        ? nextStage.replace("crm-contact-", "")
        : null;
      const overContact = overContactId ? contacts.find((c) => c.id === overContactId) : null;
      if (!overContact || !overContact.pipeline_stage || !isPipelineStage(overContact.pipeline_stage)) { setActiveContact(null); return; }
      nextStage = overContact.pipeline_stage;
    }

    if (nextStage === "Onboarded" && activeContact.pipeline_stage !== "Onboarded") {
      const burst = (opts: confetti.Options) => confetti({ particleCount: 80, spread: 70, ...opts });
      burst({ origin: { x: 0.3, y: 0.5 } });
      burst({ origin: { x: 0.7, y: 0.5 } });
      setTimeout(() => burst({ origin: { x: 0.5, y: 0.3 }, particleCount: 60 }), 150);
    }

    if (nextStage !== activeContact.pipeline_stage) {
      const translatedRect = active.rect.current.translated;
      const overRect       = over.rect;
      const rawOffset      = translatedRect && overRect ? translatedRect.top - overRect.top : -16;
      const yOffset        = Math.max(-400, Math.min(400, rawOffset));

      setDroppedContact({ id: activeContact.id, yOffset });
      setRecentlyMovedId(activeContact.id);
      movedAtRef.current.set(activeContact.id, Date.now());
      setTimeout(() => setDroppedContact(null), 600);

      updateContact.mutate({ id: activeContact.id, patch: { pipeline_stage: nextStage } });
    }
    setActiveContact(null);
  }

  const handleDelete = (id: string) => deleteContact.mutate(id);
  const handleRemoveFromPipeline = (id: string) => updateContact.mutate({ id, patch: { pipeline_stage: "" } });

  const handleStartProject = (contact: CRMContact) => {
    setStartProjectClient(contact.company);
    setPendingRemoveId(contact.pipeline_stage === "Onboarded" ? contact.id : null);
    setStartProjectOpen(true);
  };

  const handleUpdateDealValue = (id: string, value: number | undefined) => {
    updateContact.mutate({ id, patch: { deal_value: value } });
  };

  const activeContactColor =
    PIPELINE_STAGES.find((s) => s.stage === activeContact?.pipeline_stage)?.color ?? "#8888AA";

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">CRM / Clients</h2>
          <p className="text-sm text-white/40 mt-0.5">Manage contacts and track your sales pipeline</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <div className={tabBg}>
          <button onClick={() => navigate("dashboard")} className={cn(tabBtn(view === "dashboard"), "flex items-center gap-1.5")}>
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </button>
        </div>
        <div className="w-px h-5 bg-white/[0.10]" />
        <div className={tabBg}>
          <button onClick={() => navigate("contacts")}  className={tabBtn(view === "contacts")}>Contacts</button>
          <button onClick={() => navigate("pipeline")}  className={tabBtn(view === "pipeline")}>Pipeline</button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* Views */}
      {!isLoading && (
        <div className="overflow-x-clip">
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

              {/* ── Dashboard ── */}
              {view === "dashboard" && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Contacts",   value: String(contacts.length),                 sub: "in CRM",           icon: Users,       color: "#6366F1", onClick: () => navigate("contacts") },
                      { label: "Pipeline Value",   value: formatCurrency(totalPipelineValue),      sub: "total deal value", icon: DollarSign,  color: "#10B981", onClick: () => navigate("pipeline") },
                      { label: "In Onboarding",    value: String(stageCounts["Onboarding"] ?? 0),  sub: "being onboarded",  icon: TrendingUp,  color: "#F59E0B", onClick: () => navigate("pipeline") },
                      { label: "Deal Pending",     value: String(stageCounts["Deal Pending"] ?? 0), sub: "awaiting close",  icon: TrendingUp,  color: "#FF4533", onClick: () => navigate("pipeline") },
                    ].map((kpi) => (
                      <button
                        key={kpi.label}
                        onClick={kpi.onClick}
                        className="rounded-xl bg-white/[0.07] backdrop-blur-xl p-4 text-left hover:bg-white/[0.11] transition-colors duration-150 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-white/50 font-medium">{kpi.label}</span>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}22` }}>
                            <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        <p className="text-xs text-white/40 mt-1">{kpi.sub}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 rounded-xl bg-white/[0.07] backdrop-blur-xl p-4">
                      <h3 className="text-sm font-semibold text-white mb-4">Stage Breakdown</h3>
                      <StageBreakdownChart stageCounts={stageCounts} maxStageCount={maxStageCount} />
                    </div>

                    <div className="rounded-xl bg-white/[0.07] backdrop-blur-xl p-4">
                      <h3 className="text-sm font-semibold text-white mb-3">Recent Contacts</h3>
                      <div className="flex flex-col gap-2">
                        {contacts.length === 0 ? (
                          <p className="text-xs text-white/30 py-4 text-center">No contacts yet — add your first one.</p>
                        ) : (
                          contacts.slice(-4).reverse().map((c) => {
                            const stage = PIPELINE_STAGES.find((s) => s.stage === c.pipeline_stage);
                            return (
                              <button
                                key={c.id}
                                onClick={() => setSelectedContact(c)}
                                className="w-full flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] -mx-2 px-2 rounded-lg transition-colors text-left"
                              >
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: c.logo_color }}>
                                  {c.logo_initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{c.company}</p>
                                  <p className="text-xs text-white/40 truncate">{c.contact ?? "—"}</p>
                                </div>
                                {stage && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                                    style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                                  >
                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: stage.color }} />
                                    {stage.stage}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Contacts table ── */}
              {view === "contacts" && (
                <div className="flex flex-col gap-4">
                  <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search contacts…"
                      className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.07] text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
                    />
                  </div>

                  {filteredContacts.length === 0 ? (
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-12 text-center">
                      <Users className="h-8 w-8 text-white/20 mx-auto mb-3" />
                      <p className="text-sm text-white/40">
                        {search ? "No contacts match your search." : "No contacts yet — click Add Contact to get started."}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/[0.07] backdrop-blur-xl overflow-x-auto">
                      <table className="border-collapse" style={{ width: widths.reduce((a, b) => a + b, 0) }}>
                        <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            {columns.map((col, i) => (
                              <th
                                key={col}
                                className="text-left text-xs font-semibold text-white/50 uppercase tracking-wider py-3.5 relative select-none"
                                style={{ paddingLeft: i === 0 ? 20 : 16, paddingRight: 16 }}
                              >
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis block">{col}</span>
                                <div
                                  className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-col-resize group z-10"
                                  onMouseDown={(e) => onMouseDown(i, e)}
                                >
                                  <div className="w-px h-4 bg-white/[0.15] group-hover:bg-white/40 group-hover:h-full transition-all" />
                                </div>
                              </th>
                            ))}
                            {/* delete col — no header */}
                            <th className="w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {filteredContacts.map((c) => (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedContact(c)}
                              className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors last:border-0 group/row cursor-pointer"
                            >
                              <td className="px-5 py-3.5" style={{ width: widths[0] }}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: c.logo_color }}>
                                    {c.logo_initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-sm font-semibold text-white truncate">{c.company}</p>
                                      {c.location && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.08] text-white/50 whitespace-nowrap flex-shrink-0">
                                          {c.location}
                                        </span>
                                      )}
                                    </div>
                                    {c.service && <p className="text-[11px] text-white/40 truncate">{c.service}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5" style={{ width: widths[1] }}>
                                <span className="text-sm text-white/70 truncate block">{c.contact ?? "—"}</span>
                              </td>
                              <td className="px-4 py-3.5" style={{ width: widths[2] }}>
                                <span className="text-sm text-white/60 truncate block">{c.phone ?? "—"}</span>
                              </td>
                              <td className="px-4 py-3.5" style={{ width: widths[3] }}>
                                <span className="text-sm text-white/60 truncate block">{c.email ?? "—"}</span>
                              </td>
                              <td className="px-4 py-3.5" style={{ width: widths[4] }}>
                                <span className="text-sm text-white/60 truncate block">{c.website ?? "—"}</span>
                              </td>
                              <td className="px-4 py-3.5" style={{ width: widths[5] }}>
                                <span className={cn("text-sm font-medium truncate block", c.deal_value ? "text-emerald-400" : "text-white/30")}>
                                  {formatCurrency(c.deal_value)}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 w-10">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                  className="opacity-0 group-hover/row:opacity-100 text-white/20 hover:text-red-400 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Pipeline ── */}
              {view === "pipeline" && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={pointerWithin}
                  measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="overflow-x-auto pb-4">
                    <div className="flex items-start gap-4" style={{ minWidth: PIPELINE_STAGES.length * 300 }}>
                      {PIPELINE_STAGES.map((stage) => (
                        <FunnelColumn
                          key={stage.stage}
                          stage={stage.stage}
                          color={stage.color}
                          contacts={contactsByStage[stage.stage] ?? []}
                          droppedContact={droppedContact}
                          onDelete={handleDelete}
                          onOpenDetail={setSelectedContact}
                          onStartProject={handleStartProject}
                          onUpdateDealValue={handleUpdateDealValue}
                          onRemoveFromPipeline={handleRemoveFromPipeline}
                        />
                      ))}
                    </div>
                  </div>

                  <DragOverlay dropAnimation={null}>
                    {activeContact && (
                      <FunnelCard
                        contact={activeContact}
                        stageColor={activeContactColor}
                        isOverlay
                        onDelete={() => {}}
                        onOpenDetail={() => {}}
                        onStartProject={() => {}}
                        onUpdateDealValue={() => {}}
                        onRemoveFromPipeline={() => {}}
                      />
                    )}
                  </DragOverlay>
                </DndContext>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Add Contact modal */}
      <AnimatePresence>
        {addOpen && (
          <AddContactModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            saving={createContact.isPending}
            onSubmit={(data) => {
              createContact.mutate(data as Parameters<typeof createContact.mutate>[0], { onSuccess: () => setAddOpen(false) });
            }}
          />
        )}
      </AnimatePresence>

      {/* Client detail modal */}
      <ClientDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onStartProject={(contact) => {
          setSelectedContact(null);
          handleStartProject(contact);
        }}
      />

      {/* Start Project / Create List modal */}
      <CreateListModal
        open={startProjectOpen}
        onClose={() => { setStartProjectOpen(false); setStartProjectClient(undefined); setPendingRemoveId(null); }}
        defaultStage="new_project"
        defaultClientName={startProjectClient}
        onSuccess={() => {
          if (pendingRemoveId) handleRemoveFromPipeline(pendingRemoveId);
        }}
      />
    </div>
  );
}
