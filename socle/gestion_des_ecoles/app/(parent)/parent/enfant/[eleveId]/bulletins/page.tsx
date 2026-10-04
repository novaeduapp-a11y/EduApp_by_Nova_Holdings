"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParentChildHeader } from "@/components/eduadmins/parent-child-nav";
import {
  portalChipClass,
  portalKpiClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Enfant = { id: string; nom: string; prenom: string; classe: string };

type Bulletin = {
  id: string;
  periode: string;
  moyenne: number | null;
  rang: number | null;
  mention: string | null;
  dateGeneration: string;
  classe: string;
  fichierPdf: string;
};

function formatNote(value: number) {
  return Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export default function EnfantBulletinsPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;
  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const [enfantsRes, bulletinsRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch(`/api/parent/enfants/${eleveId}/bulletins`),
      ]);
      const enfantsBody = await enfantsRes.json();
      const bulletinsBody = await bulletinsRes.json();
      if (!enfantsRes.ok) throw new Error(enfantsBody.error);
      if (!bulletinsRes.ok) throw new Error(bulletinsBody.error);
      setEnfant(((enfantsBody.data ?? []) as Enfant[]).find((item) => item.id === eleveId) ?? null);
      setBulletins(bulletinsBody.data ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, [eleveId]);

  const nom = enfant ? `${enfant.prenom} ${enfant.nom}` : "Élève";

  return (
    <div className="space-y-6">
      <ParentChildHeader
        eleveId={eleveId}
        nom={enfant ? nom : undefined}
        classe={enfant?.classe}
        title="Bulletins"
        subtitle={enfant ? nom : "Bulletins scolaires"}
        active="bulletins"
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les bulletins.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-48" />
      ) : bulletins.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun bulletin disponible</p>
          <p className={`${portalMutedClass} mt-1`}>Ils apparaissent après clôture de chaque période.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bulletins.map((bulletin) => (
            <article key={bulletin.id} className={portalPanelClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold tracking-tight text-foreground">{bulletin.periode}</h2>
                  <p className={portalMutedClass}>{bulletin.classe}</p>
                </div>
                {bulletin.mention ? <span className={portalChipClass}>{bulletin.mention}</span> : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className={portalMutedClass}>Moyenne</p>
                  <p className={`${portalKpiClass} text-2xl`}>
                    {bulletin.moyenne == null ? "—" : `${formatNote(Number(bulletin.moyenne))}/20`}
                  </p>
                </div>
                <div>
                  <p className={portalMutedClass}>Rang</p>
                  <p className={`${portalKpiClass} text-2xl`}>{bulletin.rang == null ? "—" : `${bulletin.rang}e`}</p>
                </div>
              </div>
              <p className={`${portalMutedClass} mt-3`}>
                Généré le {new Date(bulletin.dateGeneration).toLocaleDateString("fr-FR")}
              </p>
              <Button asChild className="mt-4">
                <a href={bulletin.fichierPdf} target="_blank" rel="noreferrer">
                  Télécharger le PDF
                </a>
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
