"use client";

import {
  Home,
  Users,
  UserCog,
  BookOpen,
  FileText,
  Calendar,
  Megaphone,
  BarChart3,
  Mail,
  Library,
  MessageSquare,
} from "lucide-react";
import { PortalShell } from "@/components/eduadmins/portal-shell";

const navigation = [
  { name: "Accueil", href: "/prefet", icon: Home },
  { name: "Élèves", href: "/prefet/eleves", icon: Users },
  { name: "Personnel", href: "/prefet/personnel", icon: UserCog },
  { name: "Classes", href: "/prefet/classes", icon: BookOpen },
  { name: "Matières", href: "/prefet/matieres", icon: Library },
  { name: "Bulletins", href: "/prefet/bulletins", icon: FileText },
  { name: "Bilan trimestre", href: "/prefet/bilan", icon: BarChart3 },
  { name: "Emploi du temps", href: "/prefet/edt", icon: Calendar },
  { name: "Messages", href: "/prefet/messages", icon: MessageSquare },
  { name: "Convocations", href: "/prefet/convocations", icon: Mail },
  { name: "Communiqués", href: "/prefet/communiques", icon: Megaphone },
];

export default function PrefetLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      title="Préfecture"
      subtitle="Préfet · cycle isolé"
      homeHref="/prefet"
      allowedRole="PREFET"
      navigation={navigation}
    >
      {children}
    </PortalShell>
  );
}
