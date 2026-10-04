"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParentChildHeader } from "@/components/eduadmins/parent-child-nav";
import { portalMutedClass, portalPanelClass } from "@/components/eduadmins/portal-shell";

type Enfant = { id: string; nom: string; prenom: string; classe: string };

type Cours = {
  id: string;
  matiere: string;
  horaire: string;
  salle: string | null;
  professeur: string | null;
};

type Jour = { jour: string; label: string; cours: Cours[] };

export default function EnfantEdtPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;
  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [semaine, setSemaine] = useState<Jour[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const [enfantsRes, edtRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch(`/api/parent/enfants/${eleveId}/emploi-du-temps`),
      ]);
      const enfantsBody = await enfantsRes.json();
      const edtBody = await edtRes.json();
      if (!enfantsRes.ok) throw new Error(enfantsBody.error);
      if (!edtRes.ok) throw new Error(edtBody.error);
      setEnfant(((enfantsBody.data ?? []) as Enfant[]).find((item) => item.id === eleveId) ?? null);
      setSemaine(edtBody.data?.semaine ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, [eleveId]);

  const nom = enfant ? `${enfant.prenom} ${enfant.nom}` : "Élève";
  const vide = semaine.every((jour) => jour.cours.length === 0);

  return (
    <div className="space-y-6">
      <ParentChildHeader
        eleveId={eleveId}
        nom={enfant ? nom : undefined}
        classe={enfant?.classe}
        title="Emploi du temps"
        subtitle={enfant ? nom : "Semaine de classe"}
        active="edt"
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger l’emploi du temps.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : vide ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun cours planifié</p>
          <p className={`${portalMutedClass} mt-1`}>L’emploi du temps sera visible dès que le préfet l’aura posé.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {semaine.map((jour) => (
            <section key={jour.jour} className={portalPanelClass}>
              <h2 className="font-bold tracking-tight text-foreground">{jour.label}</h2>
              {jour.cours.length === 0 ? (
                <p className={`${portalMutedClass} mt-2`}>Libre</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {jour.cours.map((cours) => (
                    <li key={cours.id} className="rounded-2xl bg-muted px-3 py-2">
                      <p className="text-xs tabular-nums text-muted-foreground">{cours.horaire}</p>
                      <p className="text-sm font-medium text-foreground">{cours.matiere}</p>
                      <p className={portalMutedClass}>
                        {[cours.professeur, cours.salle].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
