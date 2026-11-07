import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://eduadmin.net").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EduApps | Suite scolaire NOVA HOLDINGS",
    template: "%s | EduApps",
  },
  description:
    "Logiciel de gestion scolaire en ligne pour les établissements au Sénégal : notes, absences, bulletins, emploi du temps et application parents EduParent.",
  applicationName: "EduApps",
  authors: [{ name: "NOVA HOLDINGS", url: "https://novaholdings.net" }],
  creator: "NOVA HOLDINGS",
  publisher: "NOVA HOLDINGS",
  keywords: [
    "gestion scolaire",
    "logiciel école Sénégal",
    "bulletin scolaire",
    "notes élèves",
    "EduParent",
    "EduAdmins",
    "NOVA HOLDINGS",
    "EduApps",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: siteUrl,
    siteName: "EduApps",
    title: "EduApps | Suite scolaire NOVA HOLDINGS",
    description:
      "Notes, absences, bulletins et suivi des familles. Une suite scolaire pour les établissements partenaires au Sénégal.",
    images: [
      {
        url: "/brand/marketing-hero.jpg",
        width: 1600,
        height: 900,
        alt: "EduApps — suite scolaire NOVA HOLDINGS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduApps | Suite scolaire NOVA HOLDINGS",
    description:
      "Logiciel de gestion scolaire en ligne pour les établissements partenaires au Sénégal.",
    images: ["/brand/marketing-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "IHo8K2VM2Mh0_ADYWx72z31KGJ43gCUl7NYoz-ORIQQ",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/eduapps-logo.png", type: "image/png" },
    ],
    apple: "/brand/eduapps-logo.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${outfit.variable} ${fraunces.variable} ${outfit.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
