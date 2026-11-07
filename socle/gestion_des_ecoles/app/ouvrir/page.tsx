"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/eduadmins/public-chrome";

const DEEP_LINK = "eduparent://login";
const APP_STORE = "https://apps.apple.com/fr/app/eduparent/id6817506848";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=sn.novaholdings.eduparent";

export default function OpenEduParentPage() {
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const started = Date.now();
    window.location.href = DEEP_LINK;
    setTried(true);
    const timer = window.setTimeout(() => {
      // Si l’app n’a pas pris le focus, on laisse les boutons magasins visibles.
      if (Date.now() - started < 2500 && document.visibilityState === "visible") {
        setTried(true);
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F7FC]">
      <PublicHeader brand="EduApps" homeHref="/" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1A5FD4]">EduParent</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#12203A]">Ouvrir l’application</h1>
        <p className="mt-3 text-base leading-7 text-[#5B6B82]">
          {tried
            ? "Si EduParent ne s’ouvre pas automatiquement, téléchargez-la ou réessayez ci-dessous."
            : "Ouverture d’EduParent en cours…"}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <a
            href={DEEP_LINK}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1A5FD4] px-5 text-sm font-semibold text-white"
          >
            Ouvrir EduParent
          </a>
          <a
            href={APP_STORE}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#12203A] outline outline-1 outline-[#E2E8F2]"
          >
            App Store
          </a>
          <a
            href={PLAY_STORE}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#12203A] outline outline-1 outline-[#E2E8F2]"
          >
            Google Play
          </a>
          <Link href="/login" className="mt-2 text-sm font-medium text-[#1A5FD4]">
            Continuer sur le web
          </Link>
        </div>
      </main>
      <PublicFooter brand="EduApps" />
    </div>
  );
}
