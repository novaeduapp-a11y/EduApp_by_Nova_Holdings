"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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

type Accueil = {
  notesRecentes: { id: string; valeur: number; matiere: string; evaluation: string }[];
  absences: { total: number; retards: number; nonJustifiees: number };
  moyenne: { valeur: number; periode: string; mention: string | null } | null;
  coursDuJour: { id: string; matiere: string; horaire: string; salle: string | null; professeur: string | null }[];
};

function formatNote(value: number) {
  return Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export default function EnfantProfilPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;
  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [accueil, setAccueil] = useState<Accueil | null>(null);
  const [bulletins, setBulletins] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const [enfantsRes, accueilRes, bulletinsRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch(`/api/parent/enfants/${eleveId}/accueil`),
        fetch(`/api/parent/enfants/${eleveId}/bulletins`),
      ]);
      const enfantsBody = await enfantsRes.json();
      const accueilBody = await accueilRes.json();
      const bulletinsBody = await bulletinsRes.json();
      if (!enfantsRes.ok) throw new Error(enfantsBody.error);
      if (!accueilRes.ok) throw new Error(accueilBody.error);
      if (!bulletinsRes.ok) throw new Error(bulletinsBody.error);
      const found = ((enfantsBody.data ?? []) as Enfant[]).find((item) => item.id === eleveId) ?? null;
      setEnfant(found);
      setAccueil(accueilBody.data ?? null);
      setBulletins((bulletinsBody.data ?? []).length);
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
        title={nom}
        subtitle="Vue d’ensemble de la scolarité"
        active="apercu"
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger l’aperçu.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href={`/parent/enfant/${eleveId}/notes`} className={portalPanelClass}>
              <p className={portalMutedClass}>Moyenne</p>
              <p className={`${portalKpiClass} mt-1`}>
                {accueil?.moyenne ? `${formatNote(Number(accueil.moyenne.valeur))}/20` : "—"}
              </p>
              <p className={`${portalMutedClass} mt-1`}>
                {accueil?.moyenne
                  ? `${accueil.moyenne.periode}${accueil.moyenne.mention ? ` · ${accueil.moyenne.mention}` : ""}`
                  : "Aucune moyenne"}
              </p>
            </Link>
            <Link href={`/parent/enfant/${eleveId}/absences`} className={portalPanelClass}>
              <p className={portalMutedClass}>Absences</p>
              <p className={`${portalKpiClass} mt-1`}>{accueil?.absences.total ?? 0}</p>
              <p className={`${portalMutedClass} mt-1`}>
                {accueil?.absences.nonJustifiees ?? 0} non justifiée{(accueil?.absences.nonJustifiees ?? 0) > 1 ? "s" : ""}
                {accueil?.absences.retards ? ` · ${accueil.absences.retards} retard${accueil.absences.retards > 1 ? "s" : ""}` : ""}
              </p>
            </Link>
            <Link href={`/parent/enfant/${eleveId}/bulletins`} className={portalPanelClass}>
              <p className={portalMutedClass}>Bulletins</p>
              <p className={`${portalKpiClass} mt-1`}>{bulletins}</p>
              <p className={`${portalMutedClass} mt-1`}>disponibles</p>
            </Link>
          </div>

          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">Cours du jour</h2>
            {(accueil?.coursDuJour ?? []).length === 0 ? (
              <p className={`${portalMutedClass} mt-2`}>Aucun cours aujourd’hui, ou week-end.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {accueil!.coursDuJour.map((cours) => (
                  <li key={cours.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl bg-muted px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{cours.matiere}</span>
                    <span className={portalMutedClass}>
                      {cours.horaire}
                      {cours.salle ? ` · ${cours.salle}` : ""}
                      {cours.professeur ? ` · ${cours.professeur}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3">
              <Link href={`/parent/enfant/${eleveId}/edt`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Voir la semaine
              </Link>
            </p>
          </section>

          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">Dernières notes</h2>
            {(accueil?.notesRecentes ?? []).length === 0 ? (
              <p className={`${portalMutedClass} mt-2`}>Aucune note récente.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {accueil!.notesRecentes.map((note) => (
                  <li key={note.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm text-foreground">
                      {note.matiere} · {note.evaluation}
                    </span>
                    <span className={portalChipClass}>{formatNote(Number(note.valeur))}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
