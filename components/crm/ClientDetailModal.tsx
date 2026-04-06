"use client";

import { useState, useRef, useEffect } from "react";
import {
  Phone,
  Mail,
  Globe,
  DollarSign,
  AlignLeft,
  Briefcase,
  FolderKanban,
  X,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUpdateCRMContact, useDeleteCRMContact } from "@/hooks/crm";
import { PIPELINE_STAGES } from "@/types/crm";
import type { CRMContact } from "@/types/crm";

interface ClientDetailModalProps {
  contact: CRMContact | null;
  onClose: () => void;
  onStartProject: (contact: CRMContact) => void;
}

function formatCurrency(value: number | undefined): string {
  if (!value) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseCurrency(raw: string): number | undefined {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? undefined : n;
}

const labelCls = "text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block";

const TAG_COLORS = [
  "#6366F1", "#3B82F6", "#06B6D4", "#10B981", "#14B8A6",
  "#F59E0B", "#FF8C00", "#EF4444", "#FF4533", "#EC4899",
  "#8B5CF6", "#A855F7",
];
const fieldCls =
  "w-full bg-transparent border-b border-white/[0.06] py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF4533]/60 transition-colors";

export function ClientDetailModal({ contact, onClose, onStartProject }: ClientDetailModalProps) {
  const updateContact = useUpdateCRMContact();
  const deleteContact = useDeleteCRMContact();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState({ label: "", color: TAG_COLORS[0] });
  const tagEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTagIdx === null && !addingTag) return;
    const handler = (e: MouseEvent) => {
      if (tagEditorRef.current && !tagEditorRef.current.contains(e.target as Node)) {
        setEditingTagIdx(null);
        setAddingTag(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editingTagIdx, addingTag]);

  if (!contact) return null;

  function save(patch: Partial<Omit<CRMContact, "id" | "created_at">>) {
    if (!contact) return;
    updateContact.mutate({ id: contact.id, patch });
  }

  function handleDelete() {
    if (!contact) return;
    deleteContact.mutate(contact.id, { onSuccess: onClose });
  }

  function saveTag() {
    if (!contact || !tagDraft.label.trim()) return;
    const tags = [...(contact.tags ?? [])];
    if (addingTag) {
      tags.push({ label: tagDraft.label.trim(), color: tagDraft.color });
    } else if (editingTagIdx !== null) {
      tags[editingTagIdx] = { label: tagDraft.label.trim(), color: tagDraft.color };
    }
    save({ tags });
    setEditingTagIdx(null);
    setAddingTag(false);
  }

  function deleteTag(idx: number) {
    if (!contact) return;
    const tags = (contact.tags ?? []).filter((_, i) => i !== idx);
    save({ tags });
    setEditingTagIdx(null);
  }

  const stage = PIPELINE_STAGES.find((s) => s.stage === contact.pipeline_stage);

  return (
    <Dialog open={!!contact} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        size="lg"
        className="max-h-[90vh] overflow-y-auto bg-white/[0.07] border-white/[0.08] backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{ backgroundColor: contact.logo_color }}
          >
            {contact.logo_initials}
          </div>
          <div className="flex-1 min-w-0">
            {/* Editable company name */}
            <input
              key={contact.id + "-company"}
              defaultValue={contact.company}
              tabIndex={-1}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== contact.company) save({ company: v });
              }}
              className="text-xl font-bold text-white bg-transparent border-b border-white/[0.06] focus:outline-none focus:border-[#FF4533]/60 transition-colors w-full pb-0.5"
            />
            {/* Pipeline stage indicator */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage?.color ?? "rgba(255,255,255,0.2)" }} />
              <span className="text-[11px] font-medium" style={{ color: stage?.color ?? "rgba(255,255,255,0.3)" }}>
                {contact.pipeline_stage || "Not in pipeline"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Contact info row */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> Contact person</span>
              </label>
              <input
                key={contact.id + "-contact"}
                defaultValue={contact.contact ?? ""}
                placeholder="Jane Smith"
                onBlur={(e) => save({ contact: e.target.value.trim() || undefined })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1"><Briefcase className="w-2.5 h-2.5" /> Service</span>
              </label>
              <input
                key={contact.id + "-service"}
                defaultValue={contact.service ?? ""}
                placeholder="Social Media"
                onBlur={(e) => save({ service: e.target.value.trim() || undefined })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> Phone</span>
              </label>
              <input
                key={contact.id + "-phone"}
                defaultValue={contact.phone ?? ""}
                placeholder="+1 (555) 000-0000"
                onBlur={(e) => save({ phone: e.target.value.trim() || undefined })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> Email</span>
              </label>
              <input
                key={contact.id + "-email"}
                defaultValue={contact.email ?? ""}
                placeholder="jane@company.com"
                type="email"
                onBlur={(e) => save({ email: e.target.value.trim() || undefined })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> Website</span>
              </label>
              <input
                key={contact.id + "-website"}
                defaultValue={contact.website ?? ""}
                placeholder="company.com"
                onBlur={(e) => save({ website: e.target.value.trim() || undefined })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input
                key={contact.id + "-location"}
                defaultValue={contact.location ?? ""}
                placeholder="Queenstown"
                onBlur={(e) => save({ location: e.target.value.trim() || undefined })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" /> Deal value</span>
              </label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">$</span>
                <input
                  key={contact.id + "-deal"}
                  defaultValue={contact.deal_value ?? ""}
                  placeholder="5,000"
                  inputMode="numeric"
                  onBlur={(e) => save({ deal_value: parseCurrency(e.target.value) })}
                  className={cn(fieldCls, "pl-4")}
                />
              </div>
              {contact.deal_value && (
                <p className="text-[11px] text-emerald-400/70 mt-0.5">{formatCurrency(contact.deal_value)}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1"><AlignLeft className="w-2.5 h-2.5" /> Notes &amp; Description</span>
            </label>
            <textarea
              key={contact.id + "-desc"}
              defaultValue={contact.description ?? ""}
              placeholder="Add notes, background info, or any relevant details about this client…"
              rows={4}
              onBlur={(e) => save({ description: e.target.value.trim() || undefined })}
              className="w-full px-0 py-1.5 bg-transparent border-b border-white/[0.06] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF4533]/60 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className={labelCls}>Tags</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {(contact.tags ?? []).map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (editingTagIdx === idx) { setEditingTagIdx(null); return; }
                    setTagDraft({ label: tag.label, color: tag.color });
                    setEditingTagIdx(idx);
                    setAddingTag(false);
                  }}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border transition-all hover:opacity-80"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: editingTagIdx === idx ? tag.color : `${tag.color}50`,
                    boxShadow: editingTagIdx === idx ? `0 0 0 2px ${tag.color}40` : "none",
                  }}
                >
                  {tag.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setTagDraft({ label: "", color: TAG_COLORS[0] });
                  setAddingTag(!addingTag);
                  setEditingTagIdx(null);
                }}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] text-white/30 hover:text-white/60 border border-dashed border-white/[0.12] hover:border-white/25 transition-all"
              >
                <Plus className="w-2.5 h-2.5" />
                Add tag
              </button>
            </div>

            {(editingTagIdx !== null || addingTag) && (
              <div
                ref={tagEditorRef}
                className="mt-2.5 p-3 rounded-xl bg-white/[0.06] border border-white/[0.10] flex flex-col gap-3"
              >
                <input
                  autoFocus
                  value={tagDraft.label}
                  onChange={(e) => setTagDraft((d) => ({ ...d, label: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTag();
                    if (e.key === "Escape") { setEditingTagIdx(null); setAddingTag(false); }
                  }}
                  placeholder="Tag name…"
                  className="w-full bg-transparent border-b border-white/[0.08] py-1 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTagDraft((d) => ({ ...d, color: c }))}
                      className="w-5 h-5 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        boxShadow: tagDraft.color === c ? `0 0 0 2px #1A1A2E, 0 0 0 4px ${c}` : "none",
                        transform: tagDraft.color === c ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveTag}
                    disabled={!tagDraft.label.trim()}
                    className="flex-1 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs text-white font-medium transition-colors disabled:opacity-40"
                  >
                    {addingTag ? "Add tag" : "Save"}
                  </button>
                  {editingTagIdx !== null && (
                    <button
                      onClick={() => deleteTag(editingTagIdx)}
                      className="h-7 px-3 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all"
                >
                  Delete contact
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">Are you sure?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { onStartProject(contact); onClose(); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Start Project
            </button>
          </div>

          <p className="text-[10px] text-white/20 text-right -mt-2">
            Added {new Date(contact.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" · "}All fields save automatically on blur
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
