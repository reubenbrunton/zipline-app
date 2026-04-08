"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Link2, Send } from "lucide-react";
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
}

export function EmailComposePanel({ template }: Props) {
  const { data: contacts = [] } = useCRMContacts();
  const sendEmail = useSendEmail();

  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [sent, setSent] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  // Reset when template changes
  useEffect(() => {
    setSelectedContact(null);
    setVariableValues({});
    setShowValidation(false);
    setSent(false);
    setContactSearch("");
  }, [template.id]);

  const variables = template.variables ?? [];

  const missingRequired = variables.some(
    (v) => v.required && !variableValues[v.key]?.trim()
  );

  async function handleSend() {
    setShowValidation(true);
    if (!selectedContact?.email || missingRequired) return;

    await sendEmail.mutateAsync({
      resendTemplateId: template.resend_template_id,
      templateId: template.id,
      templateName: template.name,
      toEmail: selectedContact.email,
      toName: selectedContact.contact ?? selectedContact.company,
      contactId: String(selectedContact.id),
      variables: variableValues,
    });

    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setSelectedContact(null);
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
        {/* Contact picker */}
        <div>
          <label className={labelCls}>Send to</label>
          <DropdownMenu onOpenChange={(o) => { if (o) setContactSearch(""); }}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full h-10 px-3 rounded-lg bg-white/[0.04] border text-sm text-left flex items-center justify-between transition-colors",
                  showValidation && !selectedContact?.email
                    ? "border-red-400/60"
                    : "border-white/[0.08] hover:border-white/[0.16]"
                )}
              >
                <span className={selectedContact ? "text-white" : "text-white/30"}>
                  {selectedContact
                    ? `${selectedContact.company}${selectedContact.contact ? ` — ${selectedContact.contact}` : ""}${selectedContact.email ? ` <${selectedContact.email}>` : ""}`
                    : "Select a client…"}
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
                {filteredContacts.length === 0 && (
                  <p className="px-3 py-2 text-xs text-[#8888AA]">No clients found</p>
                )}
                {filteredContacts.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={() => setSelectedContact(c)}
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

          {/* Email display */}
          {selectedContact && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-[#8888AA]">To:</span>
              {selectedContact.email ? (
                <span className="text-xs text-white">{selectedContact.email}</span>
              ) : (
                <span className="text-xs text-red-400">No email on file — add one in CRM first</span>
              )}
            </div>
          )}

          {showValidation && selectedContact && !selectedContact.email && (
            <p className="mt-1 text-xs text-red-300">This contact has no email address</p>
          )}
          {showValidation && !selectedContact && (
            <p className="mt-1 text-xs text-red-300">Please select a client</p>
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
