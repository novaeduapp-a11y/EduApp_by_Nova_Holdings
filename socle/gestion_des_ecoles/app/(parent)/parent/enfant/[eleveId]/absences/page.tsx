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

type Absence = {
  id: string;
  date: string;
  periode: string;
  heures: number;
  motif: string | null;
  kind: "ABSENCE" | "RETARD";
  justifiee: boolean;
  matiere: string | null;
  trimestre: string;
};

const PAGE_SIZE = 30;

export default function EnfantAbsencesPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;
  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [stats, setStats] = useState({ total: 0, retards: 0, justifiees: 0, nonJustifiees: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtreKind, setFiltreKind] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setStatus("loading");
    try {
      const [enfantsRes, absRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch(`/api/parent/enfants/${eleveId}/absences`),
      ]);
      const enfantsBody = await enfantsRes.json();
      const absBody = await absRes.json();
      if (!enfantsRes.ok) throw new Error(enfantsBody.error);
      if (!absRes.ok) throw new Error(absBody.error);
      setEnfant(((enfantsBody.data ?? []) as Enfant[]).find((item) => item.id === eleveId) ?? null);
      setAbsences(absBody.data?.absences ?? []);
      setStats(absBody.data?.stats ?? { total: 0, retards: 0, justifiees: 0, nonJustifiees: 0 });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, [eleveId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return absences.filter((item) => {
      if (filtreKind === "ABSENCE" && item.kind !== "ABSENCE") return false;
      if (filtreKind === "RETARD" && item.kind !== "RETARD") return false;
      if (filtreKind === "justifiee" && !item.justifiee) return false;
      if (filtreKind === "nonjustifiee" && item.justifiee) return false;
      if (!q) return true;
      return `${item.matiere ?? ""} ${item.motif ?? ""} ${item.trimestre}`.toLowerCase().includes(q);
    });
  }, [absences, search, filtreKind]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreKind]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);
  const nom = enfant ? `${enfant.prenom} ${enfant.nom}` : "Élève";

  return (
    <div className="space-y-6">
      <ParentChildHeader
        eleveId={eleveId}
        nom={enfant ? nom : undefined}
        classe={enfant?.classe}
        title="Absences"
        subtitle={enfant ? nom : "Historique des absences et retards"}
        active="absences"
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les absences.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Absences</p>
              <p className={`${portalKpiClass} mt-1`}>{stats.total}</p>
            </div>
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Justifiées</p>
              <p className={`${portalKpiClass} mt-1`}>{stats.justifiees}</p>
            </div>
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Non justifiées</p>
              <p className={`${portalKpiClass} mt-1`}>{stats.nonJustifiees}</p>
            </div>
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Retards</p>
              <p className={`${portalKpiClass} mt-1`}>{stats.retards}</p>
            </div>
          </div>

          <EleveToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Rechercher un motif ou une matière…"
            extra={
              <select
                className="edu-select"
                aria-label="Filtrer"
                value={filtreKind}
                onChange={(e) => setFiltreKind(e.target.value)}
              >
                <option value="">Tout</option>
                <option value="ABSENCE">Absences</option>
                <option value="RETARD">Retards</option>
                <option value="justifiee">Justifiées</option>
                <option value="nonjustifiee">Non justifiées</option>
              </select>
            }
          />

          {absences.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className="font-medium text-foreground">Aucune absence enregistrée</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className={portalMutedClass}>Aucune ligne ne correspond à la recherche.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <span className={portalChipClass}>{item.kind === "RETARD" ? "Retard" : "Absence"}</span>
                      </TableCell>
                      <TableCell>{item.matiere || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.motif || "—"}</TableCell>
                      <TableCell>{item.justifiee ? "Justifiée" : "Non justifiée"}</TableCell>
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

          {stats.nonJustifiees > 0 ? (
            <p className={portalMutedClass}>
              Pour une absence non justifiée, déposez le justificatif à l’administration de l’école.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
