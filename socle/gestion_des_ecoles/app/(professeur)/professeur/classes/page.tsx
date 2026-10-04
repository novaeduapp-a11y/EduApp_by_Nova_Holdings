"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, ChevronLeft, ChevronRight, ClipboardCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { uniqueNiveaux } from "@/lib/eleve-filter";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Classe = {
  id: string;
  nom: string;
  niveau: string;
  effectif: number;
  matieres: { id: string; nom: string }[];
};

const PAGE_SIZE = 30;

export default function ProfesseurClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [niveau, setNiveau] = useState("");
  const [matiereId, setMatiereId] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/prof/classes");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setClasses(body.data ?? []);
      setStatus("ready");
    } catch {
      setClasses([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, niveau, matiereId]);

  const niveaux = useMemo(() => uniqueNiveaux(classes), [classes]);
  const matieres = useMemo(() => {
    const map = new Map<string, string>();
    for (const classe of classes) {
      for (const matiere of classe.matieres) map.set(matiere.id, matiere.nom);
    }
    return [...map.entries()]
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [classes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((classe) => {
      if (niveau && classe.niveau !== niveau) return false;
      if (matiereId && !classe.matieres.some((item) => item.id === matiereId)) return false;
      if (!q) return true;
      return (
        classe.nom.toLowerCase().includes(q) ||
        classe.niveau.toLowerCase().includes(q) ||
        classe.matieres.some((item) => item.nom.toLowerCase().includes(q))
      );
    });
  }, [classes, search, niveau, matiereId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Mes classes</h1>
        <p className={`${portalMutedClass} mt-1`}>
          {status === "ready"
            ? `${classes.length} classe${classes.length > 1 ? "s" : ""} affectée${classes.length > 1 ? "s" : ""} · notes, appel et élèves.`
            : "Uniquement les classes qui vous sont affectées."}
        </p>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher une classe, un niveau ou une matière…"
        niveaux={niveaux}
        niveau={niveau}
        onNiveauChange={setNiveau}
        extra={
          matieres.length > 1 ? (
            <select
              className="edu-select"
              aria-label="Filtrer par matière"
              value={matiereId}
              onChange={(e) => setMatiereId(e.target.value)}
            >
              <option value="">Toutes les matières</option>
              {matieres.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger vos classes.</p>
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
          <p className="font-medium text-foreground">
            {classes.length === 0 ? "Aucune classe affectée" : "Aucune classe ne correspond à la recherche."}
          </p>
          {classes.length === 0 ? (
            <p className={`${portalMutedClass} mt-1`}>
              Le préfet doit vous affecter une matière avant de saisir notes et appel.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Classe</TableHead>
                <TableHead className="px-4">Niveau</TableHead>
                <TableHead className="hidden px-4 md:table-cell">Matières</TableHead>
                <TableHead className="px-4">Élèves</TableHead>
                <TableHead className="px-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((classe) => (
                <TableRow key={classe.id}>
                  <TableCell className="px-4 py-3.5">
                    <Link
                      href={`/professeur/classes/${classe.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {classe.nom}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <span className={portalChipClass}>{classe.niveau}</span>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3.5 md:table-cell">
                    <p className="text-sm text-foreground">
                      {classe.matieres.map((item) => item.nom).join(" · ") || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 tabular-nums text-foreground">{classe.effectif}</TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/professeur/notes?classeId=${classe.id}`} aria-label={`Notes de ${classe.nom}`}>
                          <BookOpen />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/professeur/appel?classeId=${classe.id}`} aria-label={`Appel de ${classe.nom}`}>
                          <ClipboardCheck />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/professeur/edt?classeId=${classe.id}`} aria-label={`Planning de ${classe.nom}`}>
                          <Calendar />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/professeur/classes/${classe.id}`} aria-label={`Élèves de ${classe.nom}`}>
                          <Users />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length > 0 ? (
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
          ) : null}
        </div>
      )}
    </div>
  );
}
