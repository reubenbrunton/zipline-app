"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/tasks": "Project Hub",
  "/dashboard/project-hub": "Project Hub",
  "/dashboard/crm": "CRM / Clients",
  "/dashboard/calendar": "Calendar",
  "/dashboard/invoices": "Invoices & Finance",
  "/dashboard/automations": "Email Automations",
  "/dashboard/team": "Team & Staff",
  "/dashboard/settings": "Settings",
  "/dashboard/chat": "Chat",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const title =
    pageTitles[pathname] ??
    (
      pathname.startsWith("/dashboard/project-hub/board/") ||
      pathname.startsWith("/dashboard/tasks/board/")
        ? "Project Hub — Board"
        : "Dashboard"
    );

  return (
    <div className="h-screen overflow-hidden bg-[#12121E] relative">
      {/* Background gradient — full screen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 140% 100% at 60% 20%, rgba(255,90,20,0.23) 0%, rgba(200,45,15,0.13) 45%, rgba(140,25,8,0.05) 70%, transparent 90%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(180,40,10,0.13) 0%, rgba(120,25,5,0.05) 55%, transparent 80%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 55% 30%, rgba(255,150,50,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Floating sidebar — fixed, 20px from edges */}
      <div
        className={cn(
          "fixed top-5 bottom-5 left-5 z-30 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+20px)] lg:translate-x-0"
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* Main area — offset to clear the floating sidebar */}
      <div
        className={cn(
          "flex flex-col h-full overflow-hidden transition-all duration-300 relative",
          collapsed ? "lg:pl-[104px]" : "lg:pl-[260px]"
        )}
      >
        <TopNav
          title={title}
          onMobileMenuToggle={() => setMobileOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6 relative z-10 flex flex-col">
          <div className="relative flex-1 min-h-0">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.36, ease: "linear" }}
                className="absolute inset-0 h-full"
                style={{ willChange: "opacity", backfaceVisibility: "hidden" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
