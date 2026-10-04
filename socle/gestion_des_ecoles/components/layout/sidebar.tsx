"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, School, UserCog, ChevronLeft, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signOut } from "next-auth/react";
import { useUIStore } from "@/stores/ui-store";

const menuItems = [
  { title: "Vue d’ensemble", href: "/dashboard", icon: LayoutDashboard },
  { title: "Établissements", href: "/dashboard/ecoles", icon: School },
  { title: "Comptes", href: "/dashboard/comptes", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-[#0B2F7A] to-primary transition-[width] duration-300 motion-reduce:transition-none",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-white/20 px-4">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="min-w-0">
              <p className="font-bold text-white leading-tight">Administration</p>
              <p className="text-[11px] text-white/70">NOVA HOLDINGS</p>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard" className="mx-auto" aria-label="Administration NOVA">
              <GraduationCap className="h-7 w-7 text-white" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarCollapsed ? "Déplier le menu" : "Replier le menu"}
            onClick={toggleSidebarCollapsed}
            className={cn("text-white hover:bg-white/10", sidebarCollapsed && "mx-auto")}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2" aria-label="Administration NOVA">
            {menuItems.map((item) => {
              const isActive =
                item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-[color,background-color,transform] duration-press ease-out active:scale-[0.96] motion-reduce:active:scale-100",
                    isActive ? "bg-white text-primary" : "text-white/90 hover:bg-white/10",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-white/20 p-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white",
              sidebarCollapsed && "justify-center px-2"
            )}
            aria-label="Déconnexion"
            onClick={() => signOut({ callbackUrl: "/eduadmins" })}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
