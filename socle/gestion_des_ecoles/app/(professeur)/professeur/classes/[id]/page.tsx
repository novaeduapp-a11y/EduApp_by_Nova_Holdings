"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, Calendar, ChevronLeft, ChevronRight, ClipboardCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EleveToolbar } from "@/components/shared/eleve-toolbar";
import { matchesEleveSearch } from "@/lib/eleve-filter";
import {
  portalChipClass,
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Eleve = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  sexe: "M" | "F";
  nomTuteur: string | null;
  telephoneTuteur: string | null;
  emailParent: string | null;
  parentLie: boolean;
};

type Classe = {
  id: string;
  nom: string;
  niveau: string;
  salle: string | null;
  effectif: number;
  matieres: { id: string; nom: string }[];
};

const PAGE_SIZE = 30;

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export default function ProfesseurClasseDetailPage() {
  const params = useParams<{ id: string }>();
  const [classe, setClasse] = useState<Classe | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sexe, setSexe] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!params.id) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/staff/prof/classes/${params.id}/eleves`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Impossible de charger cette classe");
      setClasse(body.classe ?? null);
      setEleves(body.data ?? []);
      setStatus("ready");
    } catch (err) {
      setClasse(null);
      setEleves([]);
      setError(err instanceof Error ? err.message : "Impossible de charger cette classe");
      setStatus("error");
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, sexe]);

  const filtered = useMemo(
    () =>
      eleves.filter((eleve) => {
        if (sexe && eleve.sexe !== sexe) return false;
        return matchesEleveSearch(eleve, search) || (eleve.nomTuteur ?? "").toLowerCase().includes(search.trim().toLowerCase());
      }),
    [eleves, search, sexe]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/professeur/classes" className={`text-sm ${portalLinkClass}`}>
          ← Mes classes
        </Link>
        <h1 className="mt-2 text-balance text-[30px] font-bold leading-9 tracking-tight">
          {classe?.nom ?? "Classe"}
        </h1>
        <p className={`${portalMutedClass} mt-1`}>
          {[classe?.niveau, classe?.salle, classe ? `${classe.effectif} élève${classe.effectif > 1 ? "s" : ""}` : null]
            .filter(Boolean)
            .join(" · ") || "Élèves de la classe affectée."}
        </p>
        {classe?.matieres.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {classe.matieres.map((matiere) => (
              <span key={matiere.id} className={portalChipClass}>
                {matiere.nom}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/professeur/appel?classeId=${params.id}`}>
            <ClipboardCheck />
            Faire l’appel
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/professeur/notes?classeId=${params.id}`}>
            <BookOpen />
            Saisir les notes
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/professeur/edt?classeId=${params.id}`}>
            <Calendar />
            Planning
          </Link>
        </Button>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        sexe={sexe}
        onSexeChange={setSexe}
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">{error}</p>
          <Button type="button" onClick={load}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>
            {eleves.length === 0 ? "Aucun élève dans cette classe." : "Aucun élève ne correspond à la recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Élève</TableHead>
                <TableHead className="hidden px-4 md:table-cell">Tuteur</TableHead>
                <TableHead className="px-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((eleve) => (
                <TableRow key={eleve.id}>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
                          {initials(eleve.prenom, eleve.nom)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {eleve.prenom} {eleve.nom}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{eleve.matricule}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3.5 md:table-cell">
                    {eleve.nomTuteur ? (
                      <div>
                        <p className="text-foreground">{eleve.nomTuteur}</p>
                        <p className="text-xs text-muted-foreground">
                          {eleve.telephoneTuteur ?? eleve.emailParent ?? "—"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">À renseigner</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      {eleve.parentLie ? (
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            href={`/professeur/messages?eleveId=${eleve.id}`}
                            aria-label={`Message aux parents de ${eleve.prenom} ${eleve.nom}`}
                          >
                            <MessageSquare />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled
                          aria-label="Aucun parent lié"
                          title="Aucun parent lié à cet élève"
                        >
                          <MessageSquare />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={portalMutedClass}>
              {from}–{to} sur {filtered.length} · {PAGE_SIZE} par page
            </p>
            {filtered.length > PAGE_SIZE ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Page précédente"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft />
                  Précédent
                </Button>
                <p className="min-w-16 text-center text-sm tabular-nums text-foreground">
                  {pageSafe}/{pageCount}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Page suivante"
                  disabled={pageSafe >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                >
                  Suivant
                  <ChevronRight />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
