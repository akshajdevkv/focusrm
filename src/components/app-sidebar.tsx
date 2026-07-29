"use client";

import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  LogOut,
  PlaySquare,
  Settings,
  Workflow
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Playlists", href: "/playlists", icon: PlaySquare },
  { label: "Focus Workspace", href: "/learn", icon: Workflow },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Logout", href: "/auth/login", icon: LogOut }
];

export function AppSidebar({ active, compact = false }: { active: string; compact?: boolean }) {
  return (
    <aside className="gloss-dark fixed bottom-0 left-0 right-0 z-40 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-3">
      <Link
        href="/"
        className={cn(
          "hidden min-h-12 items-center gap-3 rounded-lg px-3 font-normal not-italic transition hover:-translate-y-0.5 lg:flex",
          compact && "lg:justify-center lg:px-0 2xl:justify-start 2xl:px-3"
        )}
      >
        <span aria-hidden="true" className="logo-mark grid h-10 w-10 shrink-0 place-items-center rounded-md text-2xl leading-none">
          F
        </span>
        <span className={cn("brand-title", compact && "lg:hidden 2xl:inline")}>Focus Room</span>
      </Link>
      <nav className="flex justify-around p-2 lg:mt-6 lg:grid lg:gap-2 lg:p-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 lg:justify-start",
                "hover:-translate-y-0.5 hover:bg-white/10",
                active === item.label &&
                  "bg-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
                compact && "lg:justify-center lg:px-0 2xl:justify-start 2xl:px-3",
                !["Home", "Dashboard", "Focus Workspace", "Settings"].includes(item.label) &&
                  "hidden lg:flex"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className={cn("hidden lg:inline", compact && "lg:hidden 2xl:inline")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
