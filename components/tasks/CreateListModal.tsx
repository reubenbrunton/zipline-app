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
import { cn } from "@/lib/utils";
import type { List, ListStage } from "@/types/tasks";

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
}

export function CreateListModal({
  open,
  onClose,
  defaultStage = "pre_production",
  editingList = null,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  const [customHex, setCustomHex] = useState(COLOR_SWATCHES[0]);
  const [clientName, setClientName] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const createList = useCreateList();
  const updateList = useUpdateList();
  const isEditing = Boolean(editingList);
  const isSimpleList = (editingList?.stage ?? defaultStage) === "parked";

  useEffect(() => {
    if (!open) return;

    if (editingList) {
      const baseColor = (editingList.color ?? COLOR_SWATCHES[0]).toUpperCase();
      setName(editingList.name);
      setSelectedColor(baseColor);
      setCustomHex(baseColor);
      setClientName(editingList.client_name ?? "");
    } else {
      setName("");
      setSelectedColor(COLOR_SWATCHES[0]);
      setCustomHex(COLOR_SWATCHES[0]);
      setClientName("");
    }

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
        stage: defaultStage,
        client_name: isSimpleList ? undefined : clientName.trim() || undefined,
      },
      { onSuccess: onClose }
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
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Capital"
                className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors"
              />
            </div>
          )}

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
