"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Annonce = {
  id: string;
  titre: string;
  message: string;
  createdAt: string;
};

export default function DirecteurAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/annonces");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setAnnonces(body.data ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Annonces NOVA</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Messages et mises à jour publiés par l’administration NOVA pour les directions.
        </p>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les annonces.</p>
          <Button type="button" onClick={() => void load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-40" />
      ) : annonces.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucune annonce pour le moment</p>
          <p className={`${portalMutedClass} mt-1`}>
            Les messages NOVA apparaîtront ici dès leur publication.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {annonces.map((annonce) => (
            <li key={annonce.id} className={portalPanelClass}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-bold tracking-tight text-foreground">{annonce.titre}</h2>
                <p className={portalMutedClass}>
                  {new Date(annonce.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{annonce.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
