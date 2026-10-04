"use client";

import { Bell, CreditCard, Home, MessageSquare } from "lucide-react";
import { PortalShell } from "@/components/eduadmins/portal-shell";

const navigation = [
  { name: "Accueil", href: "/parent", icon: Home },
  { name: "Paiements", href: "/parent/paiements", icon: CreditCard },
  { name: "Messages", href: "/parent/messages", icon: MessageSquare },
  { name: "Alertes", href: "/parent/alertes", icon: Bell },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      title="Parent"
      subtitle="Consultation · vos enfants"
      homeHref="/parent"
      allowedRole="PARENT"
      navigation={navigation}
      mePath="/api/parent/compte"
      brand="EduParent"
      signOutHref="/login"
      accountLinks={[{ name: "Paramètres", href: "/parent/parametres" }]}
    >
      {children}
    </PortalShell>
  );
}
