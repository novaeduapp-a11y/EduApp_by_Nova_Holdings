import type { Metadata } from "next";
import { EduAppsHomeClient } from "@/components/marketing/EduAppsHomeClient";
import { JsonLd } from "@/components/seo/json-ld";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://eduadmin.net").replace(/\/$/, "");

export const metadata: Metadata = {
  title: { absolute: "EduApps | Suite scolaire NOVA HOLDINGS" },
  description:
    "Logiciel de gestion scolaire en ligne pour les établissements partenaires de NOVA HOLDINGS au Sénégal. Notes, absences, bulletins, emploi du temps et application parents EduParent.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "EduApps | Suite scolaire NOVA HOLDINGS",
    description:
      "Notes, absences, bulletins et suivi des familles. Une suite scolaire pour les établissements partenaires au Sénégal.",
    url: siteUrl,
    images: [{ url: "/brand/marketing-hero.jpg", alt: "EduApps — suite scolaire" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduApps | Suite scolaire NOVA HOLDINGS",
    description:
      "Notes, absences, bulletins et suivi des familles pour les établissements partenaires au Sénégal.",
    images: ["/brand/marketing-hero.jpg"],
  },
};

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "EduApps",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web, iOS, Android",
          url: siteUrl,
          description:
            "Suite de gestion scolaire : EduAdmins pour le personnel et EduParent pour les familles.",
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "XOF",
          },
          provider: {
            "@type": "Organization",
            name: "NOVA HOLDINGS",
            url: "https://novaholdings.net",
            email: "contact@eduadmin.net",
            telephone: ["+221767968561", "+19012923422"],
          },
        }}
      />
      <EduAppsHomeClient />
    </>
  );
}
