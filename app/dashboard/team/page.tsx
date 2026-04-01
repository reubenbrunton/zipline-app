"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Mail, Phone, X, Check, Copy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
}

function getColor(id: string): string {
  const colors = ["#FF4533", "#6366F1", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#FF8C00"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

type WizardStep = "form" | "loading" | "success";

interface Credentials { email: string; password: string }

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-xs text-white/60 hover:text-white transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<WizardStep>("form");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, avatar_url, phone");
      if (error) throw error;
      return data ?? [];
    },
  });

  function openWizard() {
    setForm({ full_name: "", email: "", phone: "" });
    setError("");
    setStep("form");
    setCredentials(null);
    setShowWizard(true);
  }

  function closeWizard() {
    setShowWizard(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) return;
    setStep("loading");
    setError("");

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setStep("form");
      return;
    }

    setCredentials({ email: json.email, password: json.password });
    setStep("success");
    queryClient.invalidateQueries({ queryKey: ["team-members"] });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.44, ease: "easeOut" }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team & Staff</h2>
          <p className="text-sm text-[#8888AA] mt-0.5">
            {isLoading ? "Loading…" : `${members.length} member${members.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openWizard}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Member
        </button>
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.07] p-5 h-[220px] animate-pulse" />
            ))
          : members.map((member) => {
              const color = getColor(member.id);
              const initials = getInitials(member.full_name, member.email);
              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.07] backdrop-blur-xl p-5 flex flex-col items-center gap-3 text-center hover:bg-white/[0.10] hover:shadow-lg hover:shadow-black/20 transition-all duration-150"
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name ?? ""} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg" style={{ backgroundColor: color }}>
                      {initials}
                    </div>
                  )}
                  <div className="w-full">
                    <h3 className="text-sm font-semibold text-white">{member.full_name ?? "Unknown"}</h3>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    {member.email && (
                      <p className="text-xs text-[#8888AA] truncate flex items-center justify-center gap-1.5">
                        <Mail className="w-3 h-3 flex-shrink-0" />{member.email}
                      </p>
                    )}
                    {member.phone && (
                      <p className="text-xs text-[#8888AA] flex items-center justify-center gap-1.5">
                        <Phone className="w-3 h-3 flex-shrink-0" />{member.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 w-full pt-2 border-t border-white/[0.05]">
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                          <Phone className="h-3.5 w-3.5" />Call
                        </button>
                      </a>
                    )}
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                          <Mail className="h-3.5 w-3.5" />Email
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

        {/* Add card */}
        <button
          onClick={openWizard}
          className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] p-5 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/20 transition-colors min-h-[220px]"
        >
          <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center">
            <Plus className="h-7 w-7 text-[#8888AA]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">New Member</p>
            <p className="text-xs text-[#8888AA] mt-0.5">Generate login access</p>
          </div>
        </button>
      </div>

      {/* Wizard modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            key="wizard-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget && step !== "loading") closeWizard(); }}
          >
            <motion.div
              key="wizard-panel"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0D0D1A] p-6 shadow-2xl"
            >
              {/* Form step */}
              {step === "form" && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-white">New Team Member</h3>
                    <button onClick={closeWizard} className="text-white/40 hover:text-white transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreate} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#8888AA] block mb-1.5">Full Name <span className="text-[#FF4533]">*</span></label>
                      <input
                        autoFocus
                        required
                        value={form.full_name}
                        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                        placeholder="Jane Smith"
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#8888AA] block mb-1.5">Email <span className="text-[#FF4533]">*</span></label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="jane@company.com"
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#8888AA] block mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 555 123 4567"
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors"
                      />
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={closeWizard} className="flex-1 h-10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!form.full_name.trim() || !form.email.trim()}
                        className="flex-1 h-10 rounded-lg text-sm font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Create Login
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Loading step */}
              {step === "loading" && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <Loader2 className="h-10 w-10 text-[#FF4533] animate-spin" />
                  <p className="text-sm text-white/60">Creating account…</p>
                </div>
              )}

              {/* Success step */}
              {step === "success" && credentials && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-white">Login Created</h3>
                    <button onClick={closeWizard} className="text-white/40 hover:text-white transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 mb-5">
                    <p className="text-xs text-[#8888AA]">Share these credentials with the new team member. The password cannot be retrieved again.</p>

                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Email</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm text-white truncate">{credentials.email}</code>
                          <CopyButton value={credentials.email} />
                        </div>
                      </div>
                      <div className="h-px bg-white/[0.06]" />
                      <div>
                        <p className="text-[10px] font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5">Password</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm text-white font-mono tracking-wider">{credentials.password}</code>
                          <CopyButton value={credentials.password} />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
                        navigator.clipboard.writeText(text);
                      }}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-white/[0.1] text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Both to Clipboard
                    </button>
                  </div>

                  <button
                    onClick={closeWizard}
                    className="w-full h-10 rounded-lg text-sm font-semibold bg-[#FF4533] text-white hover:bg-[#e03d2d] transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
