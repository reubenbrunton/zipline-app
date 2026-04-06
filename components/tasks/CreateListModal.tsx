"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateList, useUpdateList } from "@/hooks/tasks";
import { useCRMContacts } from "@/hooks/crm";
import { cn } from "@/lib/utils";
import type { List, ListStage } from "@/types/tasks";
import { AssigneePicker } from "./AssigneePicker";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLOR_SWATCHES = [
  "#FF4533",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#([0-9a-fA-F]{6})$/.test(withHash)) return null;
  return withHash.toUpperCase();
}

interface CreateListModalProps {
  open: boolean;
  onClose: () => void;
  defaultStage?: ListStage;
  editingList?: List | null;
  defaultClientName?: string;
  onSuccess?: () => void;
}

export function CreateListModal({
  open,
  onClose,
  defaultStage = "pre_production",
  editingList = null,
  defaultClientName,
  onSuccess,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  const [customHex, setCustomHex] = useState(COLOR_SWATCHES[0]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const createList = useCreateList();
  const updateList = useUpdateList();
  const { data: crmContacts = [] } = useCRMContacts();
  const isEditing = Boolean(editingList);
  const isSimpleList = (editingList?.stage ?? defaultStage) === "parked";

  useEffect(() => {
    if (!open) return;

    if (editingList) {
      const baseColor = (editingList.color ?? COLOR_SWATCHES[0]).toUpperCase();
      setName(editingList.name);
      setSelectedColor(baseColor);
      setCustomHex(baseColor);
      setAssigneeIds(editingList.assignee_ids ?? (editingList.assignee_id ? [editingList.assignee_id] : []));
      setClientName(editingList.client_name ?? "");
    } else {
      setName("");
      setSelectedColor(COLOR_SWATCHES[0]);
      setCustomHex(COLOR_SWATCHES[0]);
      setAssigneeIds([]);
      setClientName(defaultClientName ?? "");
    }

    setClientSearch("");
    setShowValidation(false);
  }, [open, editingList]);

  const hasNameError = showValidation && !name.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    if (!name.trim()) return;

    if (editingList) {
      updateList.mutate(
        {
          id: editingList.id,
          patch: {
            name: name.trim(),
            color: selectedColor,
            assignee_ids: assigneeIds,
            client_name: isSimpleList ? undefined : clientName.trim() || undefined,
          },
        },
        { onSuccess: onClose }
      );
      return;
    }

    createList.mutate(
      {
        name: name.trim(),
        color: selectedColor,
        assignee_ids: assigneeIds,
        stage: defaultStage,
        client_name: isSimpleList ? undefined : clientName.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white/[0.07] border-white/[0.08] backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? (isSimpleList ? "Edit list" : "Edit project") : (isSimpleList ? "Create a new list" : "Create a new project")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
              Project name
            </label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client Project, Sprint 3…"
              className={cn(
                "w-full h-10 px-3 rounded-lg bg-white/[0.04] border text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors",
                hasNameError ? "border-red-400/60" : "border-white/[0.08]"
              )}
            />
            {hasNameError && (
              <p className="mt-1.5 text-xs text-red-300">Project name is required.</p>
            )}
          </div>

          {/* Client — only for project lists */}
          {!isSimpleList && (
            <div>
              <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
                Client <span className="normal-case font-normal text-[#8888AA]/60">(optional)</span>
              </label>
              <DropdownMenu onOpenChange={(o) => { if (o) setClientSearch(""); }}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors"
                  >
                    <span className={clientName ? "text-white" : "text-[#8888AA]"}>
                      {clientName || "Select a client…"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8888AA] flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] p-0">
                  {/* Search */}
                  <div className="p-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <Search className="w-3 h-3 text-[#8888AA] flex-shrink-0" />
                      <input
                        autoFocus
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search contacts…"
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-[#8888AA] focus:outline-none"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    <DropdownMenuItem onSelect={() => setClientName("")} className="text-xs text-white/40">
                      No client
                    </DropdownMenuItem>
                    {crmContacts
                      .filter((c) => c.company.toLowerCase().includes(clientSearch.toLowerCase()))
                      .map((c) => (
                        <DropdownMenuItem
                          key={c.id}
                          onSelect={() => setClientName(c.company)}
                          className={cn("gap-2 text-xs", clientName === c.company && "font-medium")}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.logo_color ?? "#8888AA" }} />
                          {c.company}
                        </DropdownMenuItem>
                      ))}
                    {crmContacts.filter((c) => c.company.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                      <p className="px-3 py-2 text-xs text-[#8888AA]">No contacts found</p>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <AssigneePicker multiple values={assigneeIds} onValuesChange={setAssigneeIds} onChange={() => {}} />

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
              Colour
            </label>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    setCustomHex(color);
                  }}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      selectedColor === color
                        ? `0 0 0 2px #1A1A2E, 0 0 0 4px ${color}`
                        : "none",
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value.toUpperCase());
                  setCustomHex(e.target.value.toUpperCase());
                }}
                className="h-9 w-12 rounded-md border border-white/[0.1] bg-transparent cursor-pointer"
                aria-label="Pick custom project colour"
              />
              <input
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                onBlur={() => {
                  const normalized = normalizeHex(customHex);
                  if (normalized) {
                    setSelectedColor(normalized);
                    setCustomHex(normalized);
                  } else {
                    setCustomHex(selectedColor);
                  }
                }}
                placeholder="#FF4533"
                className="w-28 h-9 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white uppercase placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !name.trim() ||
                createList.isPending ||
                updateList.isPending
              }
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEditing
                ? updateList.isPending ? "Saving…" : "Save Changes"
                : createList.isPending ? "Creating…" : isSimpleList ? "Create List" : "Create Project"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
