"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { portalMutedClass, portalPanelClass } from "@/components/eduadmins/portal-shell";

type Fiche = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string | null;
  adresse: string | null;
  nomTuteur: string | null;
  telephoneTuteur: string | null;
  emailParent: string | null;
  lienTuteur: string | null;
  groupeSanguin: string | null;
  allergies: string | null;
  telephoneSecours: string | null;
  classe: { id: string; nom: string; niveau: string };
  absences: { id: string; dateAbsence: string; periode: string; justifiee: boolean; motif: string | null }[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value?.trim() || "—"}</dd>
    </div>
  );
}

export default function PrefetEleveFichePage() {
  const params = useParams<{ id: string }>();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch(`/api/staff/prefet/eleves/${params.id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setFiche(body.data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [params.id]);

  if (status === "loading") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (status === "error" || !fiche) {
    return (
      <div className={portalPanelClass}>
        <p className="text-sm">Impossible de charger cette fiche.</p>
        <Button asChild className="mt-4">
          <Link href="/prefet/eleves">Retour aux élèves</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-2 mb-2">
            <Link href="/prefet/eleves">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Élèves
            </Link>
          </Button>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">
            {fiche.prenom} {fiche.nom}
          </h1>
          <p className={`${portalMutedClass} mt-1 font-mono`}>{fiche.matricule}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/prefet/eleves?modifier=${fiche.id}`}>
              <Pencil className="h-4 w-4" aria-hidden />
              Modifier
            </Link>
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Imprimer
          </Button>
        </div>
      </div>
      <div className="mb-4 hidden print:block">
        <p className="text-sm text-muted-foreground">Fiche élève · {fiche.classe.nom}</p>
        <h1 className="text-2xl font-bold">
          {fiche.prenom} {fiche.nom}
        </h1>
        <p className="font-mono text-sm">{fiche.matricule}</p>
      </div>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Identité</h2>
        <dl className="mt-2 divide-y divide-border">
          <Row label="Classe" value={`${fiche.classe.nom} · ${fiche.classe.niveau}`} />
          <Row label="Sexe" value={fiche.sexe === "F" ? "Fille" : "Garçon"} />
          <Row label="Naissance" value={`${formatDate(fiche.dateNaissance)}${fiche.lieuNaissance ? ` · ${fiche.lieuNaissance}` : ""}`} />
          <Row label="Adresse" value={fiche.adresse} />
        </dl>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Tuteur</h2>
        <dl className="mt-2 divide-y divide-border">
          <Row label="Nom" value={fiche.nomTuteur} />
          <Row label="Lien" value={fiche.lienTuteur} />
          <Row label="Téléphone" value={fiche.telephoneTuteur} />
          <Row label="Secours" value={fiche.telephoneSecours} />
          <Row label="E-mail" value={fiche.emailParent} />
        </dl>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Santé</h2>
        <dl className="mt-2 divide-y divide-border">
          <Row label="Groupe sanguin" value={fiche.groupeSanguin} />
          <Row label="Allergies" value={fiche.allergies} />
        </dl>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Absences récentes</h2>
        {fiche.absences.length === 0 ? (
          <p className={`${portalMutedClass} mt-2`}>Aucune absence enregistrée.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {fiche.absences.map((absence) => (
              <li key={absence.id} className="flex justify-between gap-3">
                <span>
                  {formatDate(absence.dateAbsence)} · {absence.periode.toLowerCase()}
                  {absence.motif ? ` · ${absence.motif}` : ""}
                </span>
                <span className="text-muted-foreground">{absence.justifiee ? "Justifiée" : "Non justifiée"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
