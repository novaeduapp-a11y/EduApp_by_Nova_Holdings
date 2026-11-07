"use client";

import { PublicFooter, PublicHeader } from "@/components/eduadmins/public-chrome";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { AppDownload } from "@/components/marketing/AppDownload";
import { ProductSplit } from "@/components/marketing/ProductSplit";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { RoleStrip } from "@/components/marketing/RoleStrip";
import { ContactBand } from "@/components/marketing/ContactBand";
import { ModuleMarquee } from "@/components/marketing/ModuleMarquee";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

export function EduAppsHomeClient() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <a
        href="#produit"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-4 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-card focus:ring-2 focus:ring-ring"
      >
        Aller au produit
      </a>
      <PublicHeader brand="EduApps" />

      <main>
        <MarketingHero
          brand="EduApps"
          title={
            <>
              Tout l’établissement,
              <span className="mt-1 block italic text-primary">dans une seule suite.</span>
            </>
          }
          lead="Notes, absences, bulletins et suivi des familles. NOVA active votre école et forme vos équipes."
          imageSrc={MARKETING_IMAGES.hero}
          imageAlt="Cour d’école baignée de lumière, élèves en uniforme marchant vers le bâtiment."
          primary={{ href: "#contact", label: "Nous contacter" }}
          secondary={{ href: "/login", label: "Se connecter" }}
        />
        <ModuleMarquee />
        <ProductSplit />
        <AppDownload />
        <HowItWorks />
        <RoleStrip />
        <ContactBand />
      </main>

      <PublicFooter brand="EduApps" />
    </div>
  );
}
