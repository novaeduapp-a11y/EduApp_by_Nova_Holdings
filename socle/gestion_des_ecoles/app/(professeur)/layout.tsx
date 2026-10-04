"use client";

import { Home, Users, BookOpen, ClipboardCheck, MessageSquare, Calendar, Bell } from "lucide-react";
import { PortalShell } from "@/components/eduadmins/portal-shell";

const navigation = [
  { name: "Accueil", href: "/professeur", icon: Home },
  { name: "Messagerie", href: "/professeur/messages", icon: MessageSquare },
  { name: "Mes classes", href: "/professeur/classes", icon: Users },
  { name: "Notes", href: "/professeur/notes", icon: BookOpen },
  { name: "Appel", href: "/professeur/appel", icon: ClipboardCheck },
  { name: "Planning", href: "/professeur/edt", icon: Calendar },
  { name: "Alertes", href: "/professeur/alertes", icon: Bell },
];

export default function ProfesseurLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      title="Professeurs"
      subtitle="Classes et matières affectées"
      homeHref="/professeur"
      allowedRole="PROFESSEUR"
      navigation={navigation}
    >
      {children}
    </PortalShell>
  );
}
