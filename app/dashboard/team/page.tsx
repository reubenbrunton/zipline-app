"use client";

import { motion } from "framer-motion";
import { Plus, Mail, Phone } from "lucide-react";
import { teamMembers } from "@/lib/mock-data";

// TODO: Replace with real auth role check (e.g. session.user.role === 'admin')
const IS_ADMIN = true;

export default function TeamPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.44, ease: "easeOut" }}
      style={{ willChange: "opacity" }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team & Staff</h2>
          <p className="text-sm text-[#8888AA] mt-0.5">
            {teamMembers.length} members
          </p>
        </div>
        {IS_ADMIN && (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4533] hover:bg-[#e03d2d] text-white text-xs font-semibold rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Invite Member
          </button>
        )}
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-white/[0.07] bg-white/[0.07] backdrop-blur-xl p-5 flex flex-col items-center gap-3 text-center hover:bg-white/[0.10] hover:shadow-lg hover:shadow-black/20 transition-all duration-150"
          >
            {/* Avatar — circular, no online dot */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg flex-shrink-0"
              style={{ backgroundColor: member.color }}
            >
              {member.initials}
            </div>

            {/* Info */}
            <div className="w-full">
              <h3 className="text-sm font-semibold text-white">{member.name}</h3>
              <p className="text-xs text-[#8888AA] mt-0.5">{member.role}</p>
            </div>

            {/* Contact details */}
            <div className="flex flex-col gap-1 w-full">
              <p className="text-xs text-[#8888AA] truncate flex items-center justify-center gap-1.5">
                <Mail className="w-3 h-3 flex-shrink-0" />
                {member.email}
              </p>
              <p className="text-xs text-[#8888AA] flex items-center justify-center gap-1.5">
                <Phone className="w-3 h-3 flex-shrink-0" />
                {member.phone}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full pt-2 border-t border-white/[0.05]">
              <a href={`tel:${member.phone}`} className="flex-1">
                <button className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </button>
              </a>
              <a href={`mailto:${member.email}`} className="flex-1">
                <button className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
              </a>
            </div>
          </div>
        ))}

        {/* Invite card — admin only */}
        {IS_ADMIN && (
          <button className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] p-5 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-white/20 transition-colors min-h-[220px]">
            <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center">
              <Plus className="h-7 w-7 text-[#8888AA]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/60">Invite Member</p>
              <p className="text-xs text-[#8888AA] mt-0.5">Add to your team</p>
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );
}
