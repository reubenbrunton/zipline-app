"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Link2, Plus, Send, Trash2, X } from "lucide-react";
import { useCRMContacts } from "@/hooks/crm";
import { useSendEmail } from "@/hooks/emails";
import { cn } from "@/lib/utils";
import type { CRMContact } from "@/types/crm";
import type { EmailTemplate } from "@/types/emails";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";

interface Recipient {
  id: string;
  email: string;
  name?: string;
  isCustom: boolean;
}

interface Props {
  template: EmailTemplate;
}

export function EmailComposePanel({ template }: Props) {
  const { data: contacts = [] } = useCRMContacts();
  const sendEmail = useSendEmail();

  const [toRecipients, setToRecipients] = useState<Recipient[]>([]);
  const [ccRecipients, setCcRecipients] = useState<Recipient[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  // Reset when template changes
  useEffect(() => {
    setToRecipients([]);
    setCcRecipients([]);
    setVariableValues({});
    setShowValidation(false);
    setSent(false);
    setContactSearch("");
    setCustomEmail("");
    setCustomName("");
    setAddingCustom(false);
  }, [template.id]);

  const variables = template.variables ?? [];

  const missingRequired = variables.some(
    (v) => v.required && !variableValues[v.key]?.trim()
  );

  function addContactToTo(contact: CRMContact) {
    if (!contact.email) return;
    const id = `contact-${contact.id}`;
    if (!toRecipients.some((r) => r.id === id)) {
      setToRecipients((r) => [
        ...r,
        {
          id,
          email: contact.email,
          name: contact.contact ?? contact.company,
          isCustom: false,
        },
      ]);
    }
    setContactSearch("");
  }

  function addCustomEmail(field: "to" | "cc") {
    if (!customEmail.trim()) return;
    const id = `custom-${Date.now()}`;
    const recipient: Recipient = {
      id,
      email: customEmail.trim(),
      name: customName.trim() || undefined,
      isCustom: true,
    };
    if (field === "to") {
      setToRecipients((r) => [...r, recipient]);
    } else {
      setCcRecipients((r) => [...r, recipient]);
    }
    setCustomEmail("");
    setCustomName("");
    setAddingCustom(false);
  }

  function removeRecipient(field: "to" | "cc", id: string) {
    if (field === "to") {
      setToRecipients((r) => r.filter((x) => x.id !== id));
    } else {
      setCcRecipients((r) => r.filter((x) => x.id !== id));
    }
  }

  async function handleSend() {
    setShowValidation(true);
    if (toRecipients.length === 0 || missingRequired) return;

    // Send to first To recipient
    const primaryRecipient = toRecipients[0];
    const allEmails = [primaryRecipient.email, ...ccRecipients.map((r) => r.email)];

    await sendEmail.mutateAsync({
      resendTemplateId: template.resend_template_id,
      templateId: template.id,
      templateName: template.name,
      toEmail: primaryRecipient.email,
      toName: primaryRecipient.name,
      contactId: primaryRecipient.isCustom ? undefined : primaryRecipient.id.replace("contact-", ""),
      variables: variableValues,
    });

    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setToRecipients([]);
    setCcRecipients([]);
    setVariableValues({});
    setShowValidation(false);
  }

  const labelCls = "text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-1.5 block";
  const inputCls = "w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors";

  const filteredContacts = contacts.filter((c) =>
    c.company.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
        <h2 className="text-base font-semibold text-white">{template.name}</h2>
        {template.description && (
          <p className="text-xs text-[#8888AA] mt-0.5">{template.description}</p>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Recipients section */}
        <div className="space-y-3">
          {/* To Recipients */}
          <div>
            <label className={labelCls}>To</label>
            <div className="space-y-2 mb-3">
              {toRecipients.length === 0 ? (
                <p className="text-xs text-white/30 py-2">No recipients yet</p>
              ) : (
                toRecipients.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{r.email}</p>
                      {r.name && <p className="text-[10px] text-white/40 truncate">{r.name}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipient("to", r.id)}
                      className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add to recipient dropdown or custom */}
            <div className="space-y-2">
              <DropdownMenu onOpenChange={(o) => { if (o) setContactSearch(""); }}>
                <DropdownMenuTrigger asChild>
                  <button className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-left flex items-center justify-between text-[#8888AA] hover:text-white transition-colors">
                    <span>+ Add from clients</span>
                    <span className="text-xs">▾</span>
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
                  <div className="max-h-52 overflow-y-auto py-1">
                    {filteredContacts.length === 0 && (
                      <p className="px-3 py-2 text-xs text-[#8888AA]">No clients found</p>
                    )}
                    {filteredContacts.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onSelect={() => addContactToTo(c)}
                        className="gap-2.5 text-xs"
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.logo_color ?? "#8888AA" }} />
                        <span className="font-medium">{c.company}</span>
                        {c.contact && <span className="text-white/40">— {c.contact}</span>}
                        {!c.email && <span className="ml-auto text-red-400/70 text-[10px]">No email</span>}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Custom email input */}
              {!addingCustom ? (
                <button
                  type="button"
                  onClick={() => setAddingCustom(true)}
                  className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-left flex items-center justify-between text-[#8888AA] hover:text-white transition-colors"
                >
                  <span>+ Add custom email</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={cn(inputCls, "mb-2")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCustomEmail("to");
                    }}
                  />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Name (optional)"
                    className={cn(inputCls, "mb-2")}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addCustomEmail("to")}
                      className="flex-1 h-8 rounded-lg bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingCustom(false); setCustomEmail(""); setCustomName(""); }}
                      className="flex-1 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-white/60 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CC Recipients */}
          <div>
            <label className={labelCls}>CC <span className="normal-case font-normal opacity-50">(optional)</span></label>
            <div className="space-y-2 mb-3">
              {ccRecipients.length === 0 ? (
                <p className="text-xs text-white/30 py-2">No CC recipients</p>
              ) : (
                ccRecipients.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{r.email}</p>
                      {r.name && <p className="text-[10px] text-white/40 truncate">{r.name}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipient("cc", r.id)}
                      className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setAddingCustom(true)}
              className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-left flex items-center justify-between text-[#8888AA] hover:text-white transition-colors"
            >
              <span>+ Add CC recipient</span>
              <Plus className="w-3.5 h-3.5" />
            </button>

            {addingCustom && (
              <div className="mt-2 space-y-2 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={cn(inputCls, "mb-2")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustomEmail("cc");
                  }}
                />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Name (optional)"
                  className={cn(inputCls, "mb-2")}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addCustomEmail("cc")}
                    className="flex-1 h-8 rounded-lg bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingCustom(false); setCustomEmail(""); setCustomName(""); }}
                    className="flex-1 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-white/60 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {showValidation && toRecipients.length === 0 && (
            <p className="text-xs text-red-300">Please add at least one recipient</p>
          )}
        </div>

        {/* Variable fields */}
        {variables.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Template fields</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {variables.map((variable) => {
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
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#FF4533] transition-colors resize-none",
                        hasError ? "border-red-400/60" : "border-white/[0.08]"
                      )}
                    />
                  ) : variable.type === "url" ? (
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                      <input
                        type="url"
                        value={value}
                        onChange={(e) => setVariableValues((v) => ({ ...v, [variable.key]: e.target.value }))}
                        placeholder={variable.placeholder || "https://…"}
                        className={cn(inputCls, "pl-9", hasError && "border-red-400/60")}
                      />
                    </div>
                  ) : variable.type === "date" ? (
                    <input
                      type="date"
                      value={value}
                      onChange={(e) => setVariableValues((v) => ({ ...v, [variable.key]: e.target.value }))}
                      className={cn(inputCls, "[color-scheme:dark]", hasError && "border-red-400/60")}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setVariableValues((v) => ({ ...v, [variable.key]: e.target.value }))}
                      placeholder={variable.placeholder || `Enter ${variable.label.toLowerCase()}…`}
                      className={cn(inputCls, hasError && "border-red-400/60")}
                    />
                  )}

                  {hasError && <p className="mt-1 text-xs text-red-300">This field is required</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send footer */}
      <div className="px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
        <button
          onClick={handleSend}
          disabled={sendEmail.isPending}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            sent
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-[#FF4533] hover:bg-[#e03d2d] text-white disabled:opacity-50"
          )}
        >
          {sent ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Sent!
            </>
          ) : sendEmail.isPending ? (
            "Sending…"
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Email
            </>
          )}
        </button>

        {sendEmail.isError && (
          <p className="mt-2 text-xs text-red-400 text-center">
            {(sendEmail.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}
