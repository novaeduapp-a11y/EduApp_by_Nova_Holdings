"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EleveToolbar } from "@/components/shared/eleve-toolbar";
import { ParentChildHeader } from "@/components/eduadmins/parent-child-nav";
import {
  portalChipClass,
  portalKpiClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Enfant = { id: string; nom: string; prenom: string; classe: string };

type Note = {
  id: string;
  valeur: number;
  noteMax: number;
  evaluation: string;
  type: string;
  date: string;
  matiere: string;
  periode: string;
};

type MoyenneMatiere = { matiere: string; moyenne: number; periode: string };
type MoyenneGenerale = { moyenne: number; rang: number; mention: string; periode: string };

const PAGE_SIZE = 30;

function formatNote(value: number) {
  return Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export default function EnfantNotesPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;
  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [moyennesMatieres, setMoyennesMatieres] = useState<MoyenneMatiere[]>([]);
  const [moyennesGenerales, setMoyennesGenerales] = useState<MoyenneGenerale[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtrePeriode, setFiltrePeriode] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setStatus("loading");
    try {
      const [enfantsRes, notesRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch(`/api/parent/enfants/${eleveId}/notes`),
      ]);
      const enfantsBody = await enfantsRes.json();
      const notesBody = await notesRes.json();
      if (!enfantsRes.ok) throw new Error(enfantsBody.error);
      if (!notesRes.ok) throw new Error(notesBody.error);
      setEnfant(((enfantsBody.data ?? []) as Enfant[]).find((item) => item.id === eleveId) ?? null);
      setNotes(notesBody.data?.notes ?? []);
      setMoyennesMatieres(notesBody.data?.moyennesMatieres ?? []);
      setMoyennesGenerales(notesBody.data?.moyennesGenerales ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, [eleveId]);

  const periodes = useMemo(
    () => [...new Set(notes.map((note) => note.periode))].sort((a, b) => a.localeCompare(b, "fr")),
    [notes]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((note) => {
      if (filtrePeriode && note.periode !== filtrePeriode) return false;
      if (!q) return true;
      return `${note.matiere} ${note.evaluation} ${note.type}`.toLowerCase().includes(q);
    });
  }, [notes, search, filtrePeriode]);

  useEffect(() => {
    setPage(1);
  }, [search, filtrePeriode]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);
  const derniere = moyennesGenerales[0];
  const nom = enfant ? `${enfant.prenom} ${enfant.nom}` : "Élève";

  return (
    <div className="space-y-6">
      <ParentChildHeader
        eleveId={eleveId}
        nom={enfant ? nom : undefined}
        classe={enfant?.classe}
        title="Notes"
        subtitle={enfant ? nom : "Résultats scolaires"}
        active="notes"
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les notes.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          {derniere ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {moyennesGenerales.slice(0, 3).map((item) => (
                <div key={item.periode} className={portalPanelClass}>
                  <p className={portalMutedClass}>{item.periode}</p>
                  <p className={`${portalKpiClass} mt-1 text-3xl`}>{formatNote(Number(item.moyenne))}/20</p>
                  <p className={`${portalMutedClass} mt-1`}>
                    Rang {item.rang}
                    {item.mention ? ` · ${item.mention}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <EleveToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Rechercher une matière ou une évaluation…"
            extra={
              periodes.length > 1 ? (
                <select
                  className="edu-select"
                  aria-label="Filtrer par période"
                  value={filtrePeriode}
                  onChange={(e) => setFiltrePeriode(e.target.value)}
                >
                  <option value="">Toutes les périodes</option>
                  {periodes.map((periode) => (
                    <option key={periode} value={periode}>
                      {periode}
                    </option>
                  ))}
                </select>
              ) : null
            }
          />

          {moyennesMatieres.length > 0 ? (
            <section className={portalPanelClass}>
              <h2 className="mb-3 font-bold tracking-tight text-foreground">Moyennes par matière</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {moyennesMatieres
                  .filter((item) => !filtrePeriode || item.periode === filtrePeriode)
                  .map((item) => (
                    <li key={`${item.matiere}-${item.periode}`} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground">
                        {item.matiere}
                        <span className="text-muted-foreground"> · {item.periode}</span>
                      </span>
                      <span className={portalChipClass}>{formatNote(Number(item.moyenne))}/20</span>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          {notes.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className="font-medium text-foreground">Aucune note pour le moment</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className={portalMutedClass}>Aucune note ne correspond à la recherche.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead>Évaluation</TableHead>
                    <TableHead className="text-right">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(note.date).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="font-medium">{note.matiere}</TableCell>
                      <TableCell>
                        {note.evaluation}
                        <span className={`${portalMutedClass} mt-0.5 block`}>{note.type} · {note.periode}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatNote(Number(note.valeur))}/{note.noteMax}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className={portalMutedClass}>
                {from}–{to} sur {filtered.length} · {PAGE_SIZE} par page
              </p>
              {filtered.length > PAGE_SIZE ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pageSafe <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft />
                    Précédent
                  </Button>
                  <p className="min-w-16 text-center text-sm tabular-nums">
                    {pageSafe}/{pageCount}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pageSafe >= pageCount}
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  >
                    Suivant
                    <ChevronRight />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
