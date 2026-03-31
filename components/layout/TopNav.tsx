"use client";

import { Menu } from "lucide-react";

interface TopNavProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export function TopNav({ title, onMobileMenuToggle }: TopNavProps) {
  return (
    <header
      data-dashboard-topnav="true"
      className="h-14 flex items-center px-5 border-b border-white/[0.06] bg-transparent flex-shrink-0"
    >
      {/* Mobile menu button */}
      <button
        className="lg:hidden text-[#8888AA] hover:text-white transition-colors"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="sr-only">{title}</span>
    </header>
  );
}
