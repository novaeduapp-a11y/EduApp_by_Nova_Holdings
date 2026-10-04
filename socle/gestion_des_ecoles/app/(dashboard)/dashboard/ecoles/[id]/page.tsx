"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FAMILLES_CYCLE } from "@/lib/constants";
import { portalMutedClass, portalPanelClass } from "@/components/eduadmins/portal-shell";

type Detail = {
  id: string;
  nom: string;
  nomOfficiel: string | null;
  sigle: string | null;
  ville: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  montantMensuel: number | null;
  montantAnnuel: number | null;
  parCycle: { famille: keyof typeof FAMILLES_CYCLE; label: string; ouvert: boolean; classes: number; eleves: number }[];
  staff: { id: string; prenom: string; nom: string; role: string; familleCycle: string | null; email: string }[];
  classes: { id: string; nom: string; niveau: string; famille: string | null; eleves: number }[];
  eleves: { id: string; nom: string; prenom: string; matricule: string; classe: string; niveau: string; famille: string | null }[];
};

function cfa(value: number | null) {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function AdminEcoleFichePage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch(`/api/admin/ecoles/${params.id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setDetail(body.data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [params.id]);

  if (status === "loading") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (status === "error" || !detail) {
    return (
      <div className={portalPanelClass}>
        <p>Impossible de charger cette fiche.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/ecoles">Retour</Link>
        </Button>
      </div>
    );
  }

  const annuel = detail.montantAnnuel ?? (detail.montantMensuel != null ? detail.montantMensuel * 10 : null);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-2">
          <Link href="/dashboard/ecoles">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Établissements
          </Link>
        </Button>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">{detail.nom}</h1>
        <p className={portalMutedClass}>
          {detail.nomOfficiel || detail.nom} · {detail.ville}
          {detail.sigle ? ` · ${detail.sigle}` : ""}
        </p>
      </div>

      <section className={`${portalPanelClass} grid gap-3 sm:grid-cols-2`}>
        <p><span className="text-muted-foreground">Adresse</span><br />{detail.adresse || "—"}</p>
        <p><span className="text-muted-foreground">Téléphone</span><br />{detail.telephone || "—"}</p>
        <p><span className="text-muted-foreground">E-mail</span><br />{detail.email || "—"}</p>
        <p><span className="text-muted-foreground">Statut</span><br />{detail.actif ? "Actif" : "Inactif"}</p>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Licence NOVA</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <p className="text-sm">Mensuel<br /><span className="text-2xl font-bold tabular-nums">{cfa(detail.montantMensuel)}</span></p>
          <p className="text-sm">Annuel<br /><span className="text-2xl font-bold tabular-nums">{cfa(annuel)}</span></p>
        </div>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Cycles</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {detail.parCycle.map((cycle) => (
            <li key={cycle.famille} className="rounded-2xl bg-secondary/60 p-4">
              <p className="font-semibold">{cycle.label}</p>
              <p className={portalMutedClass}>{cycle.ouvert ? "Ouvert" : "Non ouvert"}</p>
              <p className="mt-2 text-sm tabular-nums">
                {cycle.classes} classe{cycle.classes > 1 ? "s" : ""} · {cycle.eleves} élève{cycle.eleves > 1 ? "s" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Classes</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {detail.classes.map((classe) => (
            <li key={classe.id} className="flex justify-between gap-3 py-2">
              <span>
                {classe.nom} · {classe.niveau}
                {classe.famille ? ` · ${FAMILLES_CYCLE[classe.famille as keyof typeof FAMILLES_CYCLE]?.label ?? ""}` : ""}
              </span>
              <span className="tabular-nums text-muted-foreground">{classe.eleves} élève{classe.eleves > 1 ? "s" : ""}</span>
            </li>
          ))}
          {detail.classes.length === 0 ? <li className={portalMutedClass}>Aucune classe.</li> : null}
        </ul>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Élèves</h2>
        <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto text-sm">
          {detail.eleves.map((eleve) => (
            <li key={eleve.id} className="flex justify-between gap-3">
              <span>
                {eleve.prenom} {eleve.nom}
                <span className="font-mono text-xs text-muted-foreground"> · {eleve.matricule}</span>
              </span>
              <span className="text-muted-foreground">{eleve.classe}</span>
            </li>
          ))}
          {detail.eleves.length === 0 ? <li className={portalMutedClass}>Aucun élève.</li> : null}
        </ul>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Personnel</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {detail.staff.map((personne) => (
            <li key={personne.id}>
              {personne.prenom} {personne.nom} · {personne.role}
              {personne.familleCycle ? ` · ${FAMILLES_CYCLE[personne.familleCycle as keyof typeof FAMILLES_CYCLE]?.label}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
