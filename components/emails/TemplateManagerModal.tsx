"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Plus, Trash2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateEmailTemplate, useUpdateEmailTemplate } from "@/hooks/emails";
import { cn } from "@/lib/utils";
import type { EmailTemplate, TemplateVariable, VariableType } from "@/types/emails";

const VARIABLE_TYPES: { value: VariableType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Paragraph" },
  { value: "url", label: "URL / Link" },
  { value: "date", label: "Date" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: EmailTemplate | null;
}

const emptyVar = (): TemplateVariable => ({ key: "", label: "", type: "text", required: false, placeholder: "" });

export function TemplateManagerModal({ open, onClose, editing }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resendId, setResendId] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const create = useCreateEmailTemplate();
  const update = useUpdateEmailTemplate();
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setResendId(editing.resend_template_id);
      setPreviewUrl(editing.preview_image_url ?? "");
      setVariables(editing.variables ?? []);
    } else {
      setName(""); setDescription(""); setResendId(""); setPreviewUrl(""); setVariables([]);
    }
    setShowValidation(false);
  }, [open, editing]);

  function updateVar(i: number, patch: Partial<TemplateVariable>) {
    setVariables((v) => v.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  }

  function removeVar(i: number) {
    setVariables((v) => v.filter((_, idx) => idx !== i));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setPreviewUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    if (!name.trim() || !resendId.trim()) return;

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      resend_template_id: resendId.trim(),
      variables,
      preview_image_url: previewUrl.trim() || undefined,
    };

    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  }

  const labelCls = "text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5 block";
  const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white/[0.07] border-white/[0.08] backdrop-blur-xl max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Template" : "New Email Template"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className={labelCls}>Template Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome / Onboarding"
              className={cn(inputCls, showValidation && !name.trim() && "border-red-400/60")}
            />
            {showValidation && !name.trim() && <p className="mt-1 text-xs text-red-300">Required</p>}
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description <span className="normal-case font-normal opacity-50">(optional)</span></label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this email do?"
              className={inputCls}
            />
          </div>

          {/* Resend Template ID */}
          <div>
            <label className={labelCls}>Resend Template ID</label>
            <input
              value={resendId}
              onChange={(e) => setResendId(e.target.value)}
              placeholder="t_xxxxxxxxxxxxxxxx"
              className={cn(inputCls, showValidation && !resendId.trim() && "border-red-400/60")}
            />
            <p className="mt-1 text-[11px] text-white/30">Found in your Resend dashboard under Templates</p>
            {showValidation && !resendId.trim() && <p className="mt-1 text-xs text-red-300">Required</p>}
          </div>

          {/* Preview image upload */}
          <div>
            <label className={labelCls}>Preview Image <span className="normal-case font-normal opacity-50">(optional)</span></label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.04]">
                <img src={previewUrl} alt="Preview" className="w-full h-36 object-cover object-top" />
                <button
                  type="button"
                  onClick={() => setPreviewUrl("")}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-24 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.03] flex flex-col items-center justify-center gap-2 text-[#8888AA] hover:text-white hover:border-white/25 hover:bg-white/[0.05] transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs">Uploading…</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs">Upload from device</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={cn(labelCls, "mb-0")}>Variables</label>
              <button
                type="button"
                onClick={() => setVariables((v) => [...v, emptyVar()])}
                className="flex items-center gap-1 text-xs text-[#8888AA] hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add variable
              </button>
            </div>

            {variables.length === 0 && (
              <p className="text-xs text-white/20 py-3 text-center border border-dashed border-white/[0.08] rounded-lg">
                No variables — this template sends as-is
              </p>
            )}

            <div className="space-y-2">
              {variables.map((v, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  {/* Key */}
                  <input
                    value={v.key}
                    onChange={(e) => updateVar(i, { key: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                    placeholder="variable_key"
                    className="flex-1 h-8 px-2 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
                  />
                  {/* Label */}
                  <input
                    value={v.label}
                    onChange={(e) => updateVar(i, { label: e.target.value })}
                    placeholder="Display label"
                    className="flex-1 h-8 px-2 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF4533]"
                  />
                  {/* Type */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="h-8 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs text-white/70 hover:text-white whitespace-nowrap">
                        {VARIABLE_TYPES.find((t) => t.value === v.type)?.label ?? "Text"} ▾
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {VARIABLE_TYPES.map((t) => (
                        <DropdownMenuItem key={t.value} onSelect={() => updateVar(i, { type: t.value })} className="text-xs">
                          {t.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Required toggle */}
                  <button
                    type="button"
                    onClick={() => updateVar(i, { required: !v.required })}
                    className={cn("h-8 px-2.5 rounded-md text-xs border transition-colors whitespace-nowrap", v.required ? "bg-[#FF4533]/10 border-[#FF4533]/30 text-[#FF4533]" : "bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/60")}
                  >
                    {v.required ? "Required" : "Optional"}
                  </button>
                  {/* Remove */}
                  <button type="button" onClick={() => removeVar(i)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : editing ? "Save Changes" : "Create Template"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
