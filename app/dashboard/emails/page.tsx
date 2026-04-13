"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useEmailTemplates } from "@/hooks/emails";
import { useCRMContacts } from "@/hooks/crm";
import { useUser } from "@/hooks/useUser";
import { isTeamOwnerEmail } from "@/lib/team-admin";
import { EmailTemplatePicker } from "@/components/emails/EmailTemplatePicker";
import { EmailComposePanel } from "@/components/emails/EmailComposePanel";
import { EmailDashboard } from "@/components/emails/EmailDashboard";
import type { CRMContact } from "@/types/crm";
import type { EmailTemplate } from "@/types/emails";

type View = "dashboard" | "compose";

function EmailsPageInner() {
  const searchParams = useSearchParams();
  const { data: templates = [], isLoading } = useEmailTemplates();
  const { data: contacts = [] } = useCRMContacts();
  const { data: user } = useUser();
  const [view, setView] = useState<View>("dashboard");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [initialContact, setInitialContact] = useState<CRMContact | null>(null);

  const isAdmin = isTeamOwnerEmail(user?.email);

  // Handle deep-link from CRM onboarding prompt
  useEffect(() => {
    const contactId = searchParams.get("contactId");
    const autoTemplate = searchParams.get("autoTemplate");
    if (!contactId || !autoTemplate || templates.length === 0 || contacts.length === 0) return;

    const contact = contacts.find((c) => c.id === contactId) ?? null;
    const template = templates.find((t) =>
      t.name.toLowerCase().includes(autoTemplate.toLowerCase())
    ) ?? null;

    if (template) {
      setInitialContact(contact);
      setSelectedTemplate(template);
      setView("compose");
    }
  }, [searchParams, templates, contacts]);

  function goBack() {
    setView("dashboard");
    setSelectedTemplate(null);
    setInitialContact(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.44, ease: "easeOut" }}
      style={{ willChange: "opacity" }}
      className="h-full flex flex-col"
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          {view === "compose" && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-[#8888AA] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">Emails</h1>
            <p className="text-sm text-[#8888AA] mt-0.5">
              {view === "dashboard" ? "Email activity and send history" : "Send a templated email to a client"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <AnimatePresence mode="sync" initial={false}>
          {view === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "linear" }}
              className="absolute inset-0 overflow-hidden"
              style={{ willChange: "opacity", backfaceVisibility: "hidden" }}
            >
              <EmailDashboard onCompose={() => setView("compose")} />
            </motion.div>
          ) : (
            <motion.div
              key="compose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "linear" }}
              className="absolute inset-0 flex flex-col"
              style={{ willChange: "opacity", backfaceVisibility: "hidden" }}
            >
              <div className="flex-1 flex rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden min-h-0">
                {/* Left: template picker */}
                {isLoading ? (
                  <div className="w-[300px] flex-shrink-0 p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-36 rounded-xl bg-white/[0.04] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <EmailTemplatePicker
                    templates={templates}
                    selected={selectedTemplate}
                    onSelect={setSelectedTemplate}
                    isAdmin={isAdmin}
                  />
                )}

                {/* Right: compose panel or empty state */}
                {selectedTemplate ? (
                  <EmailComposePanel
                    template={selectedTemplate}
                    initialContact={initialContact}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                      <Mail className="w-6 h-6 text-white/20" />
                    </div>
                    <p className="text-sm font-medium text-white/40">Select a template to get started</p>
                    <p className="text-xs text-white/20 mt-1">Choose from the left panel</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense>
      <EmailsPageInner />
    </Suspense>
  );
}
