"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Link2, Send, X } from "lucide-react";
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

interface Props {
  template: EmailTemplate;
  initialContact?: CRMContact | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailComposePanel({ template, initialContact }: Props) {
  const { data: contacts = [] } = useCRMContacts();
  const sendEmail = useSendEmail();

  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(initialContact ?? null);
  const [toEmail, setToEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  // Apply initialContact when provided (e.g. deep-linked from CRM)
  useEffect(() => {
    if (!initialContact) return;
    setSelectedContact(initialContact);
    setToEmail(initialContact.email ?? "");
  }, [initialContact?.id]);

  // Reset when template changes
  const mountedTemplateId = useRef(template.id);
  useEffect(() => {
    if (mountedTemplateId.current === template.id) return;
    mountedTemplateId.current = template.id;
    setSelectedContact(null);
    setToEmail("");
    setCcEmails([]);
    setCcInput("");
    setVariableValues({});
    setShowValidation(false);
    setSent(false);
    setContactSearch("");
  }, [template.id]);

  // Update toEmail when contact is selected
  useEffect(() => {
    if (selectedContact?.email) {
      setToEmail(selectedContact.email);
      // Auto-fill client fields by matching variable labels
      const variables = template.variables ?? [];
      const updatedVars = { ...variableValues };

      variables.forEach((v) => {
        const labelLower = v.label.toLowerCase();
        // Match client name variations
        if ((labelLower.includes("client") || labelLower.includes("client's")) && labelLower.includes("name")) {
          updatedVars[v.key] = selectedContact.contact ?? selectedContact.company ?? "";
        }
        // Match client email variations
        if ((labelLower.includes("client") || labelLower.includes("client's")) && labelLower.includes("email")) {
          updatedVars[v.key] = selectedContact.email ?? "";
        }
      });

      setVariableValues(updatedVars);
    }
  }, [selectedContact, template.variables]);

  const variables = template.variables ?? [];

  const missingRequired = variables.some(
    (v) => v.required && !variableValues[v.key]?.trim()
  );

  function handleToEmailChange(value: string) {
    setToEmail(value);
    // Check if there's a valid email to extract
    const trimmed = value.trim();
    if ((trimmed.endsWith(" ") || trimmed.includes("  ")) && EMAIL_REGEX.test(trimmed.trim())) {
      const email = trimmed.trim().split(/\s+/)[0];
      if (EMAIL_REGEX.test(email)) {
        setToEmail(email);
      }
    }
  }

  function handleToEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const trimmed = toEmail.trim();
    if ((e.key === "Enter" || e.key === " ") && EMAIL_REGEX.test(trimmed)) {
      e.preventDefault();
      setToEmail(trimmed);
    }
  }

  function handleCcInputChange(value: string) {
    setCcInput(value);
    // Check if there's a valid email to extract
    const trimmed = value.trim();
    if ((trimmed.endsWith(" ") || trimmed.includes("  ")) && EMAIL_REGEX.test(trimmed.trim())) {
      const email = trimmed.trim().split(/\s+/)[0];
      if (EMAIL_REGEX.test(email) && !ccEmails.includes(email)) {
        setCcEmails([...ccEmails, email]);
        setCcInput("");
      }
    }
  }

  function handleCcInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const trimmed = ccInput.trim();
    if ((e.key === "Enter" || e.key === " ") && EMAIL_REGEX.test(trimmed)) {
      e.preventDefault();
      if (!ccEmails.includes(trimmed)) {
        setCcEmails([...ccEmails, trimmed]);
        setCcInput("");
      }
    }
  }

  function removeCcEmail(email: string) {
    setCcEmails(ccEmails.filter((e) => e !== email));
  }

  async function handleSend() {
    setShowValidation(true);
    if (!toEmail.trim() || missingRequired) return;

    // Auto-fill hidden email fields with toEmail
    const finalVars = { ...variableValues };
    variables.forEach((v) => {
      if (v.label.toLowerCase().includes("email")) {
        finalVars[v.key] = toEmail.trim();
      }
    });

    await sendEmail.mutateAsync({
      resendTemplateId: template.resend_template_id,
      templateId: template.id,
      templateName: template.name,
      toEmail: toEmail.trim(),
      toName: selectedContact?.contact ?? selectedContact?.company,
      contactId: selectedContact ? String(selectedContact.id) : undefined,
      variables: finalVars,
      ccEmails: ccEmails.length > 0 ? ccEmails : undefined,
    });

    const burst = (opts: confetti.Options) => confetti({ particleCount: 80, spread: 70, ...opts });
    burst({ origin: { x: 0.3, y: 0.5 } });
    burst({ origin: { x: 0.7, y: 0.5 } });
    setTimeout(() => burst({ origin: { x: 0.5, y: 0.3 }, particleCount: 60 }), 150);

    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setSelectedContact(null);
    setToEmail("");
    setCcEmails([]);
    setCcInput("");
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
        {/* Send to client or other */}
        <div>
          <label className={labelCls}>Send to</label>
          <DropdownMenu onOpenChange={(o) => { if (o) setContactSearch(""); }}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full h-10 px-3 rounded-lg bg-white/[0.04] border text-sm text-left flex items-center justify-between transition-colors",
                  showValidation && !toEmail.trim()
                    ? "border-red-400/60"
                    : "border-white/[0.08] hover:border-white/[0.16]"
                )}
              >
                <span className={selectedContact ? "text-white" : "text-white/30"}>
                  {selectedContact
                    ? `${selectedContact.company}${selectedContact.contact ? ` — ${selectedContact.contact}` : ""}`
                    : "Select a client or custom email…"}
                </span>
                <span className="text-white/30 text-xs">▾</span>
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
                <DropdownMenuItem
                  onSelect={() => { setSelectedContact(null); setToEmail(""); setVariableValues({}); setContactSearch(""); }}
                  className="text-xs text-white/40"
                >
                  None / Custom Email
                </DropdownMenuItem>
                {filteredContacts.length === 0 && (
                  <p className="px-3 py-2 text-xs text-[#8888AA]">No clients found</p>
                )}
                {filteredContacts.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={() => { setSelectedContact(c); setContactSearch(""); }}
                    className="gap-2.5 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.logo_color ?? "#8888AA" }} />
                    <span className="font-medium">{c.company}</span>
                    {c.contact && <span className="text-white/40">— {c.contact}</span>}
                    {c.email && <span className="ml-auto text-white/30 text-[10px]">{c.email}</span>}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Email address field */}
        <div>
          <label className={labelCls}>Email address</label>
          <input
            type="email"
            value={toEmail}
            onChange={(e) => handleToEmailChange(e.target.value)}
            onKeyDown={handleToEmailKeyDown}
            placeholder="email@example.com (press space or enter to confirm)"
            className={cn(inputCls, showValidation && !toEmail.trim() && "border-red-400/60")}
          />
          {showValidation && !toEmail.trim() && (
            <p className="mt-1 text-xs text-red-300">Email is required</p>
          )}
        </div>

        {/* CC field */}
        <div>
          <label className={labelCls}>CC <span className="normal-case font-normal opacity-50">(optional)</span></label>
          <div className="space-y-2">
            {ccEmails.length > 0 && (
              <div className="space-y-1.5">
                {ccEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <span className="text-xs text-white truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeCcEmail(email)}
                      className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                    >
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
              onKeyDown={handleCcInputKeyDown}
              placeholder="Add CC email (press space or enter to add)"
              autoComplete="off"
              className={inputCls}
            />
          </div>
        </div>

        {/* Variable fields */}
        {variables.length > 0 && (
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
