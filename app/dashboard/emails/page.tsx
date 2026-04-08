"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useEmailTemplates } from "@/hooks/emails";
import { useUser } from "@/hooks/useUser";
import { isTeamOwnerEmail } from "@/lib/team-admin";
import { EmailTemplatePicker } from "@/components/emails/EmailTemplatePicker";
import { EmailComposePanel } from "@/components/emails/EmailComposePanel";
import { EmailSendHistory } from "@/components/emails/EmailSendHistory";
import type { EmailTemplate } from "@/types/emails";

export default function EmailsPage() {
  const { data: templates = [], isLoading } = useEmailTemplates();
  const { data: user } = useUser();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const isAdmin = isTeamOwnerEmail(user?.email);

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
        <div>
          <h1 className="text-xl font-bold text-white">Emails</h1>
          <p className="text-sm text-[#8888AA] mt-0.5">Send templated emails to your clients</p>
        </div>
      </div>

      {/* Main panel */}
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
          <div className="flex-1 flex flex-col min-h-0">
            <EmailComposePanel template={selectedTemplate} />
            <EmailSendHistory />
          </div>
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
  );
}
