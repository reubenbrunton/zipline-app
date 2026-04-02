"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Users,
  Calendar,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ZiplineLogo } from "@/components/logo/ZiplineLogo";

interface NavChild {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavChild[];
  disabled?: boolean;
}

const CRM_EXTERNAL_URL = "https://app.attio.com/zipline-marketing/home";

const navItems: NavItem[] = [
  { href: "/dashboard/project-hub", label: "Project Hub", icon: FolderKanban },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/team", label: "Team & Staff", icon: UserCog },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    queryClient.clear();
    router.push("/login");
  };

  const toggleExpand = (href: string) => {
    setExpanded((prev) => (prev === href ? null : href));
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full rounded-2xl transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-[64px]" : "w-[228px]"
      )}
      style={{
        background: "rgba(7, 7, 14, 0.97)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {/* Logo + collapse toggle */}
      <div
        className={cn(
          "flex items-center h-14 px-3 flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <ZiplineLogo variant="white" className="h-6 w-auto" />
        )}
        <button
          onClick={onToggle}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/[0.06] transition-all flex-shrink-0",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <span className="flex"><ChevronRight className="h-3 w-3 -mr-1" /><ChevronRight className="h-3 w-3" /></span>
          ) : (
            <span className="flex"><ChevronLeft className="h-3 w-3 -mr-1" /><ChevronLeft className="h-3 w-3" /></span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mx-3 flex-shrink-0" />

      {/* Nav items */}
      <nav className="flex-1 py-2.5 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon, badge, children, disabled }) => {
            const isActive =
              !disabled &&
              (href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href));
            const hasChildren = !!children?.length;
            const isExpanded = expanded === href;

            return (
              <li key={href}>
                {/* Main nav item */}
                <div
                  className={cn(
                    "relative flex items-center rounded-xl text-sm transition-colors duration-150 select-none",
                    collapsed && "justify-center mx-1",
                    disabled
                      ? "text-white/25 cursor-not-allowed"
                      : isActive ? "text-white" : "text-white/95 hover:text-white"
                  )}
                  title={collapsed ? label : undefined}
                >
                  {/* Sliding background */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-xl bg-white/[0.09]"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}

                  {/* Clickable nav area — always navigates (unless disabled) */}
                  <div
                    className={cn(
                      "flex items-center gap-3 flex-1 px-3 py-3",
                      collapsed && "justify-center px-0",
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    )}
                    onClick={() => !disabled && router.push(href)}
                  >
                    <Icon
                      className={cn(
                        "relative flex-shrink-0 transition-colors z-10",
                        collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                        isActive ? "text-[#FF4533]" : "text-current"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="relative flex-1 truncate font-medium z-10">{label}</span>
                        {badge && (
                          <span className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 leading-none flex-shrink-0">
                            {badge}
                          </span>
                        )}
                        {!hasChildren && isActive && (
                          <ChevronRight className="relative z-10 h-3.5 w-3.5 flex-shrink-0 text-white/35" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Dropdown toggle — only shown when expanded and has children */}
                  {!collapsed && hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(href);
                      }}
                      className="relative z-10 flex items-center justify-center w-7 h-7 mr-1.5 rounded-lg hover:bg-white/[0.08] transition-colors flex-shrink-0"
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-white transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  )}
                </div>

                {/* Sub-items */}
                <AnimatePresence initial={false}>
                  {!collapsed && hasChildren && isExpanded && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden mt-0.5 ml-3 space-y-0.5 border-l border-white/[0.06] pl-3"
                    >
                      {children!.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
                                childActive
                                  ? "text-white font-medium"
                                  : "text-white/65 hover:text-white/90"
                              )}
                            >
                              <ChevronRight className="h-3 w-3 flex-shrink-0 text-white/25" />
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        {/* CRM external link */}
        <ul className="space-y-0.5 px-2 mt-0.5">
          <li>
            <a
              href={CRM_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "relative flex items-center rounded-xl text-sm transition-colors duration-150 select-none text-white/95 hover:text-white",
                collapsed ? "justify-center mx-1" : ""
              )}
              title={collapsed ? "CRM" : undefined}
            >
              <div className={cn(
                "flex items-center gap-3 flex-1 px-3 py-3",
                collapsed && "justify-center px-0"
              )}>
                <Users className={cn(
                  "flex-shrink-0 transition-colors",
                  collapsed ? "h-5 w-5" : "h-[18px] w-[18px]"
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate font-medium">CRM</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0 text-white/30" />
                  </>
                )}
              </div>
            </a>
          </li>
        </ul>

        {/* ... section separator */}
        <div className="px-4 py-2 mt-1">
          <div className="flex items-center gap-1">
            {collapsed ? (
              <MoreHorizontal className="h-4 w-4 mx-auto text-white/20" />
            ) : (
              <>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mx-3 flex-shrink-0" />

      {/* Settings */}
      <div className="px-2 py-2 flex-shrink-0">
        <Link
          href="/dashboard/settings"
          className={cn(
            "relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors duration-150",
            collapsed && "justify-center px-0 mx-1",
            pathname === "/dashboard/settings" ? "text-white" : "text-white/95 hover:text-white"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          {pathname === "/dashboard/settings" && (
            <motion.span
              layoutId="nav-active-bg"
              className="absolute inset-0 rounded-xl bg-white/[0.09]"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <Settings
            className={cn(
              "relative z-10 flex-shrink-0 h-[18px] w-[18px]",
              pathname === "/dashboard/settings" ? "text-[#FF4533]" : "text-current"
            )}
          />
          {!collapsed && (
            <>
              <span className="relative z-10 flex-1 font-medium">Settings</span>
              {pathname === "/dashboard/settings" && (
                <ChevronRight className="relative z-10 h-3.5 w-3.5 flex-shrink-0 text-white/35" />
              )}
            </>
          )}
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mx-3 flex-shrink-0" />

      {/* User */}
      <div className="p-3 flex-shrink-0">
        {collapsed ? (
          <div className="flex justify-center">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover cursor-pointer"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                style={{ backgroundColor: "#FF4533" }}
              >
                {user?.initials ?? "?"}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#FF4533" }}
              >
                {user?.initials ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name ?? "Loading..."}</p>
              <p className="text-xs text-white/40 truncate">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
