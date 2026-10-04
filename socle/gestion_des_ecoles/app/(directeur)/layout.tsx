"use client";

import { Home, BarChart3, Users, Calendar, Megaphone, MessageSquare } from "lucide-react";
import { PortalShell } from "@/components/eduadmins/portal-shell";

const navigation = [
  { name: "Bilan du jour", href: "/directeur", icon: Home },
  { name: "Aperçu", href: "/directeur/apercu", icon: BarChart3 },
  { name: "Personnel", href: "/directeur/personnel", icon: Users },
  { name: "Messages", href: "/directeur/messages", icon: MessageSquare },
  { name: "Communiqués", href: "/directeur/communiques", icon: Megaphone },
  { name: "Agenda", href: "/directeur/agenda", icon: Calendar },
];

export default function DirecteurLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      title="Direction"
      subtitle="Directeur · son école"
      homeHref="/directeur"
      allowedRole="DIRECTEUR"
      navigation={navigation}
    >
      {children}
    </PortalShell>
  );
}
