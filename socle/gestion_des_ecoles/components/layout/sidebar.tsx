"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  LogOut,
  UserCog,
  MessageSquare,
  Wallet,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signOut } from "next-auth/react";
import { useUIStore } from "@/stores/ui-store";

const menuItems = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Élèves",
    href: "/eleves",
    icon: Users,
  },
  {
    title: "Classes",
    href: "/classes",
    icon: GraduationCap,
  },
  {
    title: "Matières",
    href: "/matieres",
    icon: BookOpen,
  },
  {
    title: "Notes",
    href: "/notes",
    icon: ClipboardList,
  },
  {
    title: "Absences",
    href: "/absences",
    icon: Calendar,
  },
  {
    title: "Bulletins",
    href: "/bulletins",
    icon: FileText,
  },
  {
    title: "Appréciations",
    href: "/appreciations",
    icon: MessageSquare,
  },
  {
    title: "Paiements",
    href: "/paiements",
    icon: Wallet,
  },
  {
    title: "Comptes Parents",
    href: "/parents",
    icon: UserCheck,
  },
  {
    title: "Utilisateurs",
    href: "/utilisateurs",
    icon: UserCog,
  },
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-lg">Gestion Scolaire</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard" className="mx-auto">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapsed}
            className={cn(sidebarCollapsed && "mx-auto")}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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

        {/* Footer */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-red-600",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
