export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connexion sécurisée aux espaces EduApps et EduAdmins.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
