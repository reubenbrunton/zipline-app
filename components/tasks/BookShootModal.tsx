"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AssigneePicker } from "./AssigneePicker";

interface BookShootModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    shoot_date: string;
    shoot_time?: string;
    shoot_deliverables?: string;
    shoot_invitee_ids: string[];
  }) => void;
  saving?: boolean;
  existing?: {
    shoot_date?: string;
    shoot_time?: string;
    shoot_deliverables?: string;
    shoot_invitee_ids?: string[];
  };
}

const labelCls = "text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block";
const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors";

export function BookShootModal({ open, onClose, onSave, saving, existing }: BookShootModalProps) {
  const [date, setDate] = useState(existing?.shoot_date ?? "");
  const [time, setTime] = useState(existing?.shoot_time ?? "");
  const [deliverables, setDeliverables] = useState(existing?.shoot_deliverables ?? "");
  const [inviteeIds, setInviteeIds] = useState<string[]>(existing?.shoot_invitee_ids ?? []);

  useEffect(() => {
    if (open) {
      setDate(existing?.shoot_date ?? "");
      setTime(existing?.shoot_time ?? "");
      setDeliverables(existing?.shoot_deliverables ?? "");
      setInviteeIds(existing?.shoot_invitee_ids ?? []);
    }
  }, [open, existing?.shoot_date, existing?.shoot_time, existing?.shoot_deliverables, existing?.shoot_invitee_ids]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    onSave({
      shoot_date: date,
      shoot_time: time || undefined,
      shoot_deliverables: deliverables.trim() || undefined,
      shoot_invitee_ids: inviteeIds,
    });
  }

  const isEditing = !!existing?.shoot_date;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white/[0.07] border-white/[0.08] backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Shoot Booking" : "Book a Shoot"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Shoot Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={inputCls}
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className={labelCls}>
                Time <span className="normal-case font-normal text-[#8888AA]/60">(optional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputCls}
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Invitees */}
          <AssigneePicker
            multiple
            label="Invite Team Members"
            values={inviteeIds}
            onValuesChange={setInviteeIds}
            onChange={() => {}}
          />

          {/* Deliverables */}
          <div>
            <label className={labelCls}>
              Deliverables <span className="normal-case font-normal text-[#8888AA]/60">(optional)</span>
            </label>
            <textarea
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="List everything you need to capture on the shoot day…"
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors resize-none"
            />
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
              disabled={!date || saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : isEditing ? "Update Booking" : "Book Shoot"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
