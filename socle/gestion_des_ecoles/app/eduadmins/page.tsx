import type { Metadata } from "next";
import { EduAdminsLandingClient } from "@/components/eduadmins/eduadmins-landing-client";
import { JsonLd } from "@/components/seo/json-ld";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://eduadmin.net").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "EduAdmins | Portails professeurs, préfets et direction",
  description:
    "Espace personnel EduAdmins : portails professeurs, préfets et direction pour les établissements partenaires de NOVA HOLDINGS au Sénégal.",
  alternates: { canonical: "/eduadmins" },
  openGraph: {
    title: "EduAdmins | Espace personnel scolaire",
    description:
      "Connexion des équipes éducatives : notes, absences, emploi du temps, communiqués et messagerie.",
    url: `${siteUrl}/eduadmins`,
    images: [{ url: "/brand/eduadmins-hero.jpg", alt: "EduAdmins — portails scolaires" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduAdmins | Portails scolaires",
    description:
      "Portails professeurs, préfets et direction pour les établissements partenaires.",
    images: ["/brand/eduadmins-hero.jpg"],
  },
};

export default function EduAdminsLanding() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "EduAdmins",
          applicationCategory: "BusinessApplication",
          url: `${siteUrl}/eduadmins`,
          description:
            "Portails web pour professeurs, préfets et direction : gestion pédagogique et administrative.",
          isPartOf: {
            "@type": "SoftwareApplication",
            name: "EduApps",
            url: siteUrl,
          },
          provider: {
            "@type": "Organization",
            name: "NOVA HOLDINGS",
            url: "https://novaholdings.net",
          },
        }}
      />
      <EduAdminsLandingClient />
    </>
  );
}
