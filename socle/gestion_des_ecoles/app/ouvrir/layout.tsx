import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ouvrir EduParent",
  description:
    "Ouvrez l’application EduParent pour suivre la scolarité de vos enfants : notes, absences, bulletins et messages de l’école.",
  alternates: { canonical: "/app" },
  openGraph: {
    title: "Ouvrir EduParent",
    description: "Application parents EduApps — suivi scolaire pour les familles.",
    url: "/app",
    images: [{ url: "/brand/eduparent/icon.png", alt: "EduParent" }],
  },
  robots: { index: true, follow: true },
};

export default function AppBridgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
