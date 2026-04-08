"use client";

import { useState } from "react";
import { ImageIcon, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteEmailTemplate } from "@/hooks/emails";
import { TemplateManagerModal } from "./TemplateManagerModal";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@/types/emails";

interface Props {
  templates: EmailTemplate[];
  selected: EmailTemplate | null;
  onSelect: (t: EmailTemplate) => void;
  isAdmin: boolean;
}

export function EmailTemplatePicker({ templates, selected, onSelect, isAdmin }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const deleteTemplate = useDeleteEmailTemplate();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: EmailTemplate) {
    setEditing(t);
    setModalOpen(true);
  }

  return (
    <>
      <div className="w-[300px] flex-shrink-0 flex flex-col h-full border-r border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8888AA]">Templates</span>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1 text-[11px] text-[#8888AA] hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {templates.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
              <p className="text-sm text-white/30">No templates yet</p>
              {isAdmin && (
                <button onClick={openCreate} className="mt-2 text-xs text-[#FF4533] hover:text-[#e03d2d] transition-colors">
                  + Add your first template
                </button>
              )}
            </div>
          )}

          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              className={cn(
                "group relative rounded-xl border p-3 cursor-pointer transition-all",
                selected?.id === t.id
                  ? "border-[#FF4533]/40 bg-[#FF4533]/[0.06]"
                  : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.12]"
              )}
            >
              {/* Admin menu */}
              {isAdmin && (
                <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.1] text-[#8888AA] hover:text-white transition-all">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[130px]">
                      <DropdownMenuItem onSelect={() => openEdit(t)} className="gap-2 text-xs">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => deleteTemplate.mutate(t.id)}
                        className="gap-2 text-xs text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Preview image */}
              {t.preview_image_url ? (
                <div className="w-full h-28 rounded-lg overflow-hidden mb-3 bg-white/[0.04]">
                  <img src={t.preview_image_url} alt={t.name} className="w-full h-full object-cover object-top" />
                </div>
              ) : (
                <div className="w-full h-20 rounded-lg mb-3 bg-white/[0.04] flex items-center justify-center border border-dashed border-white/[0.08]">
                  <ImageIcon className="w-5 h-5 text-white/20" />
                </div>
              )}

              {/* Name */}
              <p className="text-sm font-semibold text-white leading-tight pr-6">{t.name}</p>

              {/* Description */}
              {t.description && (
                <p className="text-xs text-[#8888AA] mt-1 line-clamp-2">{t.description}</p>
              )}

              {/* Variable count */}
              {(t.variables?.length ?? 0) > 0 && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {t.variables.length} {t.variables.length === 1 ? "variable" : "variables"}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <TemplateManagerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </>
  );
}
