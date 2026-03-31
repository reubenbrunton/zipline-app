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
import { crmContacts } from "@/lib/mock-data";
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
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [showValidation, setShowValidation] = useState(false);

  const createList = useCreateList();
  const updateList = useUpdateList();
  const clientOptions = [...crmContacts].sort((a, b) => a.company.localeCompare(b.company));
  const isEditing = Boolean(editingList);

  useEffect(() => {
    if (!open) return;

    if (editingList) {
      const baseColor = (editingList.color ?? COLOR_SWATCHES[0]).toUpperCase();
      setName(editingList.name);
      setSelectedColor(baseColor);
      setCustomHex(baseColor);

      if (typeof editingList.client_contact_id === "number") {
        setSelectedClientId(editingList.client_contact_id);
      } else if (editingList.client_name) {
        const matched = crmContacts.find((contact) => contact.company === editingList.client_name);
        setSelectedClientId(matched?.id ?? "");
      } else {
        setSelectedClientId("");
      }
    } else {
      setName("");
      setSelectedColor(COLOR_SWATCHES[0]);
      setCustomHex(COLOR_SWATCHES[0]);
      setSelectedClientId("");
    }

    setShowValidation(false);
  }, [open, editingList]);

  const hasNameError = showValidation && !name.trim();
  const hasClientError = showValidation && selectedClientId === "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowValidation(true);

    if (!name.trim() || selectedClientId === "") return;

    const selectedClient =
      crmContacts.find((contact) => contact.id === selectedClientId) ?? null;

    if (!selectedClient) return;

    if (editingList) {
      updateList.mutate(
        {
          id: editingList.id,
          patch: {
            name: name.trim(),
            color: selectedColor,
            client_contact_id: selectedClient.id,
            client_name: selectedClient.company,
          },
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
      return;
    }

    createList.mutate(
      {
        name: name.trim(),
        color: selectedColor,
        stage: defaultStage,
        client_contact_id: selectedClient.id,
        client_name: selectedClient.company,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white/[0.07] border-white/[0.08] backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit project" : "Create a new project"}</DialogTitle>
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

          {/* Client */}
          <div>
            <label className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block">
              Client
            </label>
            <select
              required
              value={selectedClientId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedClientId(value === "" ? "" : Number(value));
              }}
              className={cn(
                "w-full h-10 px-3 rounded-lg bg-white/[0.04] border text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors",
                hasClientError ? "border-red-400/60" : "border-white/[0.08]"
              )}
            >
              <option value="" className="bg-[#1A1A2E] text-white/80">
                No client selected
              </option>
              {clientOptions.map((contact) => (
                <option key={contact.id} value={contact.id} className="bg-[#1A1A2E] text-white">
                  {contact.company} — {contact.contact}
                </option>
              ))}
            </select>
            {hasClientError && (
              <p className="mt-1.5 text-xs text-red-300">Client is required.</p>
            )}
          </div>

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
                selectedClientId === "" ||
                createList.isPending ||
                updateList.isPending
              }
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEditing
                ? updateList.isPending
                  ? "Saving…"
                  : "Save Changes"
                : createList.isPending
                ? "Creating…"
                : "Create Project"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
