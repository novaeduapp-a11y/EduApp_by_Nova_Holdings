"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Ancienne URL : redirige vers la messagerie unifiée (onglet Préfet / Direction). */
export default function ProfEquipeRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/professeur/messages?tab=equipe");
  }, [router]);
  return <p className="text-sm text-muted-foreground">Redirection vers la messagerie…</p>;
}
