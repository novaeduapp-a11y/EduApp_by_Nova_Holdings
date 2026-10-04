import type { Metadata } from "next";
import { EduAdminsLandingClient } from "@/components/eduadmins/eduadmins-landing-client";

export const metadata: Metadata = {
  title: "EduAdmins | Espace personnel",
  description:
    "Portails professeurs, préfets et direction. Connexion pour les établissements partenaires de NOVA HOLDINGS.",
};

export default function EduAdminsLanding() {
  return <EduAdminsLandingClient />;
}
