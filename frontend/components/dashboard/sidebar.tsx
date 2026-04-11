"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Lightbulb, Activity, BarChart3, Settings,
  ChevronLeft, ChevronRight, Activity as Sparkles, LogOut, Menu, X, MessageCircle
} from "lucide-react";
import { PhysicalButton } from "@/components/ui/mechanics";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/chat", label: "Chatbot", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

import { useUser, SignOutButton } from "@clerk/nextjs";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();

  const initials = `${user?.firstName?.charAt(0) || 'U'}${user?.lastName?.charAt(0) || ''}`;
  const userName = user?.fullName || 'User';

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg md:hidden shadow-floating bg-background border-none active:shadow-pressed"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-muted-bg/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 flex flex-col
          bg-background shadow-[8px_0_16px_rgba(186,190,204,0.5)] border-r border-[#ffffff]
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[80px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="relative flex items-center gap-4 px-6 py-8 border-b border-muted-bg/50 shadow-[0_1px_0_#ffffff]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-floating">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-foreground" style={{ textShadow: '0 1px 1px #ffffff' }}>
              AURA
            </span>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-2 text-muted-fg hover:text-accent md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 flex flex-col gap-3 px-4 py-8 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group flex items-center gap-4 rounded-xl transition-all duration-200 min-h-[48px]
                  ${isActive
                    ? "bg-background shadow-recessed text-accent px-4"
                    : "text-muted-fg hover:text-foreground hover:bg-panel hover:shadow-sharp px-4"
                  }
                  ${collapsed ? "justify-center px-0 hover:px-0" : ""}
                `}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "drop-shadow-[0_0_4px_rgba(255,71,87,0.4)]" : ""}`} />
                  {isActive && <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-glow" />}
                </div>
                {!collapsed && (
                  <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="relative p-6 pt-0 flex flex-col gap-4">
          <div className={`p-4 rounded-xl bg-background shadow-recessed flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-10 h-10 shrink-0 rounded-full bg-background shadow-floating border border-[#ffffff] flex items-center justify-center text-sm font-bold text-foreground uppercase">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{userName}</p>
                <p className="text-xs font-mono text-accent uppercase font-bold mt-1">Premium</p>
              </div>
            )}
          </div>
          <SignOutButton redirectUrl="/">
            <button className={`flex items-center gap-3 w-full p-3 rounded-xl bg-background shadow-floating border border-[#ffffff] text-accent hover:bg-accent/10 transition-colors ${collapsed ? "justify-center" : "px-4"}`}>
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-bold uppercase tracking-wide">Logout</span>}
            </button>
          </SignOutButton>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-4 top-24 w-8 h-8 items-center justify-center rounded-full bg-background shadow-floating border border-[#ffffff] text-muted-fg hover:text-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}
