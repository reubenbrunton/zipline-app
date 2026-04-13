"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ChevronDown, Link2, Send, X } from "lucide-react";
import { Search } from "lucide-react";
import { useSendEmail, useEmailTemplates } from "@/hooks/emails";
import { useCRMContacts } from "@/hooks/crm";
import { cn } from "@/lib/utils";
import type { CRMContact } from "@/types/crm";
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  contact: CRMContact;
  onClose: () => void;
}

export function OnboardingEmailTile({ contact, onClose }: Props) {
  const { data: templates = [], isLoading: templatesLoading } = useEmailTemplates();
  const { data: contacts = [] } = useCRMContacts();
  const sendEmail = useSendEmail();

  const template = templates.find((t) => t.name.toLowerCase().includes("onboard")) ?? templates[0] ?? null;

  const [selectedContact, setSelectedContact] = useState<CRMContact>(contact);
  const [toEmail, setToEmail] = useState(contact.email ?? "");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    if (!template || !selectedContact) return;
    const updatedVars: Record<string, string> = {};
    (template.variables ?? []).forEach((v) => {
      const ll = v.label.toLowerCase();
      if ((ll.includes("client") || ll.includes("client's")) && ll.includes("name")) {
        updatedVars[v.key] = selectedContact.contact ?? selectedContact.company ?? "";
      }
      if ((ll.includes("client") || ll.includes("client's")) && ll.includes("email")) {
        updatedVars[v.key] = selectedContact.email ?? "";
      }
    });
    setVariableValues(updatedVars);
    setToEmail(selectedContact.email ?? "");
  }, [template?.id, selectedContact.id]);

  const variables = template?.variables ?? [];
  const missingRequired = variables.some((v) => v.required && !variableValues[v.key]?.trim());

  function handleCcInputChange(value: string) {
    setCcInput(value);
    const trimmed = value.trim();
    if ((trimmed.endsWith(" ") || trimmed.includes("  ")) && EMAIL_REGEX.test(trimmed.trim())) {
      const email = trimmed.split(/\s+/)[0];
      if (EMAIL_REGEX.test(email) && !ccEmails.includes(email)) {
        setCcEmails([...ccEmails, email]);
        setCcInput("");
      }
    }
  }

  function handleCcKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const trimmed = ccInput.trim();
    if ((e.key === "Enter" || e.key === " ") && EMAIL_REGEX.test(trimmed)) {
      e.preventDefault();
      if (!ccEmails.includes(trimmed)) {
        setCcEmails([...ccEmails, trimmed]);
        setCcInput("");
      }
    }
  }

  async function handleSend() {
    if (!template) return;
    setShowValidation(true);
    if (!toEmail.trim() || missingRequired) return;

    const finalVars = { ...variableValues };
    variables.forEach((v) => {
      if (v.label.toLowerCase().includes("email")) finalVars[v.key] = toEmail.trim();
    });

    await sendEmail.mutateAsync({
      resendTemplateId: template.resend_template_id,
      templateId: template.id,
      templateName: template.name,
      toEmail: toEmail.trim(),
      toName: selectedContact.contact ?? selectedContact.company,
      contactId: String(selectedContact.id),
      variables: finalVars,
    });

    const burst = (opts: confetti.Options) => confetti({ particleCount: 80, spread: 70, ...opts });
    burst({ origin: { x: 0.3, y: 0.5 } });
    burst({ origin: { x: 0.7, y: 0.5 } });
    setTimeout(() => burst({ origin: { x: 0.5, y: 0.3 }, particleCount: 60 }), 150);

    setSent(true);
    setTimeout(() => onClose(), 2200);
  }

  const labelCls = "text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-2 block";
  const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors";
  const filteredContacts = contacts.filter((c) => c.company.toLowerCase().includes(contactSearch.toLowerCase()));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white/[0.07] border-white/[0.08] backdrop-blur-xl max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: contact.logo_color }}
            >
              {contact.logo_initials}
            </div>
            <div>
              <DialogTitle>
                {templatesLoading ? "Send Onboarding Email" : (template?.name ?? "Send Onboarding Email")}
              </DialogTitle>
              <p className="text-xs text-[#8888AA] mt-0.5">{contact.company}</p>
            </div>
          </div>
        </DialogHeader>

        {templatesLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#8888AA]">Loading template…</p>
          </div>
        ) : !template ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-sm text-white/40">No onboarding template found.</p>
            <p className="text-xs text-[#8888AA]">Create one in Emails with "onboard" in the name.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Send to */}
            <div>
              <label className={labelCls}>Send to</label>
              <DropdownMenu onOpenChange={(o) => { if (o) setContactSearch(""); }}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full h-10 px-3 rounded-lg bg-white/[0.04] border text-sm text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors",
                      showValidation && !toEmail.trim() ? "border-red-400/60" : "border-white/[0.08]"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {selectedContact && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedContact.logo_color }} />
                      )}
                      <span className="text-white truncate">
                        {`${selectedContact.company}${selectedContact.contact ? ` — ${selectedContact.contact}` : ""}`}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8888AA] flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] p-0">
                  <div className="p-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <Search className="w-3 h-3 text-[#8888AA] flex-shrink-0" />
                      <input
                        autoFocus
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search clients…"
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-[#8888AA] focus:outline-none"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {filteredContacts.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onSelect={() => { setSelectedContact(c); setContactSearch(""); }}
                        className={cn("gap-2 text-xs", selectedContact.id === c.id && "font-medium")}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.logo_color ?? "#8888AA" }} />
                        {c.company}
                        {c.contact && <span className="text-white/40">— {c.contact}</span>}
                        {c.email && <span className="ml-auto text-white/30 text-[10px]">{c.email}</span>}
                      </DropdownMenuItem>
                    ))}
                    {filteredContacts.length === 0 && (
                      <p className="px-3 py-2 text-xs text-[#8888AA]">No clients found</p>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Email address */}
            <div>
              <label className={labelCls}>Email address</label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="email@example.com"
                className={cn(inputCls, showValidation && !toEmail.trim() && "border-red-400/60")}
              />
              {showValidation && !toEmail.trim() && (
                <p className="mt-1.5 text-xs text-red-300">Email is required</p>
              )}
            </div>

            {/* CC */}
            <div>
              <label className={labelCls}>CC <span className="normal-case font-normal text-[#8888AA]/60">(optional)</span></label>
              <div className="space-y-2">
                {ccEmails.length > 0 && (
                  <div className="space-y-1.5">
                    {ccEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <span className="text-xs text-white truncate">{email}</span>
                        <button type="button" onClick={() => setCcEmails(ccEmails.filter((e) => e !== email))} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="email"
                  value={ccInput}
                  onChange={(e) => handleCcInputChange(e.target.value)}
                  onKeyDown={handleCcKeyDown}
                  placeholder="Add CC email (press space or enter to add)"
                  autoComplete="off"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Variable fields */}
            {variables.filter((v) => !v.label.toLowerCase().includes("email")).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Template fields</span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
                {variables.filter((v) => !v.label.toLowerCase().includes("email")).map((variable) => {
                  const value = variableValues[variable.key] ?? "";
                  const hasError = showValidation && variable.required && !value.trim();
                  return (
                    <div key={variable.key}>
                      <label className={labelCls}>
                        {variable.label}
                        {variable.required && <span className="text-[#FF4533] ml-0.5">*</span>}
                      </label>
                      {variable.type === "textarea" ? (
                        <textarea
                          value={value}
                          onChange={(e) => setVariableValues((v) => ({ ...v, [variable.key]: e.target.value }))}
                          placeholder={variable.placeholder || `Enter ${variable.label.toLowerCase()}…`}
                          rows={3}
                          className={cn("w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border text-sm text-white placeholder:text-[#8888AA] focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors resize-none", hasError ? "border-red-400/60" : "border-white/[0.08]")}
                        />
                      ) : variable.type === "url" ? (
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8888AA] pointer-events-none" />
                          <input type="url" value={value} onChange={(e) => setVariableValues((v) => ({ ...v, [variable.key]: e.target.value }))} placeholder={variable.placeholder || "https://…"} className={cn(inputCls, "pl-9", hasError && "border-red-400/60")} />
                        </div>
                      ) : variable.type === "date" ? (
                        <input type="date" value={value} onChange={(e) => setVariableValues((v) => ({ ...v, [variable.key]: e.target.value }))} className={cn(inputCls, "[color-scheme:dark]", hasError && "border-red-400/60")} />
                      ) : (
                        <input type="text" value={value} onChange={(e) => setVariableValues((v) => ({ ...v, [variable.key]: e.target.value }))} placeholder={variable.placeholder || `Enter ${variable.label.toLowerCase()}…`} className={cn(inputCls, hasError && "border-red-400/60")} />
                      )}
                      {hasError && <p className="mt-1.5 text-xs text-red-300">This field is required</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {template && (
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Exit
            </button>
            <button
              onClick={handleSend}
              disabled={sendEmail.isPending || sent}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                sent
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-[#FF4533] text-white hover:bg-[#e03d2d] disabled:opacity-50"
              )}
            >
              {sent ? (
                <><CheckCircle2 className="w-4 h-4" /> Sent!</>
              ) : sendEmail.isPending ? "Sending…" : (
                <><Send className="w-4 h-4" /> Send Email</>
              )}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
