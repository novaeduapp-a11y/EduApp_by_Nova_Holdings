"use client";

import { LayoutDashboard, School, UserCog, Settings, ScrollText } from "lucide-react";
import { PortalShell } from "@/components/eduadmins/portal-shell";

const navigation = [
  { name: "Vue d’ensemble", href: "/dashboard", icon: LayoutDashboard },
  { name: "Établissements", href: "/dashboard/ecoles", icon: School },
  { name: "Comptes", href: "/dashboard/comptes", icon: UserCog },
  { name: "Paramètres", href: "/dashboard/parametres", icon: Settings },
  { name: "Logs et suivi", href: "/dashboard/logs", icon: ScrollText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      title="Administration"
      subtitle="NOVA HOLDINGS"
      homeHref="/dashboard"
      allowedRole="ADMIN"
      navigation={navigation}
      brand="NOVA"
      signOutHref="/login"
    >
      {children}
    </PortalShell>
  );
}
