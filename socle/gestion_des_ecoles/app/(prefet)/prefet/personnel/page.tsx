"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Statut = "PRESENT" | "ABSENT" | "RETARD" | "ABSENT_RETARD";
type TypeProf = "MATIERE" | "PRIMAIRE" | null;

type Personne = {
  id: string;
  nom: string;
  email?: string | null;
  type: TypeProf;
  affectations: string[];
  statut: Statut;
};

const PAGE_SIZE = 30;

const STATUT_LABEL: Record<Statut, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  RETARD: "Retard",
  ABSENT_RETARD: "Abs. + retard",
};

function snapshotOf(list: Personne[]) {
  return JSON.stringify(list.map((item) => ({ id: item.id, statut: item.statut })));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatJour(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function initials(nom: string) {
  const parts = nom.trim().split(/\s+/);
  return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase();
}

function typeLabel(type: TypeProf) {
  return type === "PRIMAIRE" ? "Instituteur" : "Matière";
}

export default function PrefetPersonnelPage() {
  const { toast } = useToast();
  const [date, setDate] = useState(todayIso);
  const [personnel, setPersonnel] = useState<Personne[]>([]);
  const [snapshot, setSnapshot] = useState("[]");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyAll, setBusyAll] = useState(false);
  const [locked, setLocked] = useState(false);
  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [page, setPage] = useState(1);
  const [tousPresentsOpen, setTousPresentsOpen] = useState(false);
  const dirty = snapshotOf(personnel) !== snapshot;

  const load = useCallback(
    async (nextDate: string, mode: "full" | "soft" = "full") => {
      if (mode === "full") setStatus("loading");
      else setRefreshing(true);
      try {
        const res = await fetch(`/api/staff/prefet/personnel?date=${encodeURIComponent(nextDate)}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        const list = (body.data.personnel ?? []) as Personne[];
        setPersonnel(list);
        setSnapshot(snapshotOf(list));
        setLocked(Boolean(body.data?.verrouille));
        if (body.data?.date) setDate(body.data.date);
        setStatus("ready");
      } catch {
        if (mode === "full") {
          setPersonnel([]);
          setSnapshot("[]");
          setLocked(false);
          setStatus("error");
        } else {
          toast({ variant: "destructive", title: "Impossible d’actualiser le personnel" });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    void load(todayIso(), "full");
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreType, filtreStatut, date]);

  const changeDate = (next: string) => {
    if (!next || next === date) return;
    setDate(next);
    void load(next, status === "ready" ? "soft" : "full");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return personnel.filter((personne) => {
      if (filtreType === "PRIMAIRE" && personne.type !== "PRIMAIRE") return false;
      if (filtreType === "MATIERE" && personne.type === "PRIMAIRE") return false;
      if (filtreStatut && personne.statut !== filtreStatut) return false;
      if (!q) return true;
      return (
        personne.nom.toLowerCase().includes(q) ||
        (personne.email ?? "").toLowerCase().includes(q) ||
        personne.affectations.some((item) => item.toLowerCase().includes(q))
      );
    });
  }, [personnel, search, filtreType, filtreStatut]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const presents = personnel.filter((item) => item.statut === "PRESENT").length;
  const absents = personnel.filter((item) => item.statut === "ABSENT" || item.statut === "ABSENT_RETARD").length;
  const retards = personnel.filter((item) => item.statut === "RETARD" || item.statut === "ABSENT_RETARD").length;

  const setStatut = (userId: string, next: Statut) => {
    if (locked) return;
    setPersonnel((current) =>
      current.map((item) => (item.id === userId ? { ...item, statut: next } : item))
    );
  };

  const save = async () => {
    if (locked || !dirty) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/prefet/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          lignes: personnel.map((item) => ({ userId: item.id, statut: item.statut })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setSnapshot(snapshotOf(personnel));
      setLocked(true);
      toast({
        title: "Liste du personnel enregistrée",
        description: "Enregistrement définitif · visible sur le bilan direction.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enregistrement refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = async () => {
    if (locked) return;
    setBusyAll(true);
    try {
      setPersonnel((current) => current.map((item) => ({ ...item, statut: "PRESENT" as const })));
      setTousPresentsOpen(false);
      toast({ title: "Toute l’équipe est marquée présente.", description: "Cliquez sur Enregistrer pour valider." });
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Personnel</h1>
          <p className={`${portalMutedClass} mt-1 capitalize`}>
            {formatJour(date)}
            {" · "}
            Saisissez absences et retards du personnel, puis Enregistrer (définitif).{" "}
            <Link href="/prefet" className={portalLinkClass}>
              Retour à l’accueil
            </Link>
          </p>
          {locked ? (
            <p className="mt-2 text-sm font-medium text-amber-700">
              Liste déjà enregistrée pour cette date — modification impossible.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Jour précédent"
              disabled={refreshing}
              onClick={() => changeDate(shiftDate(date, -1))}
            >
              <ChevronLeft />
            </Button>
            <Input
              type="date"
              aria-label="Date du personnel"
              className="w-[11.5rem]"
              value={date}
              disabled={refreshing}
              onChange={(e) => changeDate(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Jour suivant"
              disabled={refreshing}
              onClick={() => changeDate(shiftDate(date, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
          {date !== todayIso() ? (
            <Button type="button" variant="outline" disabled={refreshing} onClick={() => changeDate(todayIso())}>
              Aujourd’hui
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => setTousPresentsOpen(true)}
            disabled={locked || personnel.length === 0 || presents === personnel.length}
          >
            Tous présents
          </Button>
          <Button type="button" onClick={save} disabled={locked || saving || !dirty || personnel.length === 0}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Enregistrer
          </Button>
        </div>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un professeur, une matière ou une classe…"
        extra={
          <>
            <select
              className="edu-select"
              aria-label="Filtrer par type"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="PRIMAIRE">Instituteurs</option>
              <option value="MATIERE">Professeurs de matière</option>
            </select>
            <select
              className="edu-select"
              aria-label="Filtrer par statut"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="PRESENT">Présents</option>
              <option value="ABSENT">Absents</option>
              <option value="RETARD">Retards</option>
            </select>
          </>
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger le personnel.</p>
          <Button type="button" onClick={() => load(date, "full")}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : personnel.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun professeur dans cet établissement</p>
          <p className={`${portalMutedClass} mt-1`}>Les comptes enseignants apparaissent ici une fois créés.</p>
        </div>
      ) : (
        <>
          <div className={`flex flex-wrap gap-2 ${refreshing ? "opacity-70" : ""}`}>
            <span className={portalChipClass}>{presents} présent{presents > 1 ? "s" : ""}</span>
            <span className={portalChipClass}>{absents} absent{absents > 1 ? "s" : ""}</span>
            <span className={portalChipClass}>{retards} retard{retards > 1 ? "s" : ""}</span>
          </div>

          {filtered.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className={portalMutedClass}>Aucun professeur ne correspond à la recherche.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4">Enseignant</TableHead>
                    <TableHead className="hidden px-4 md:table-cell">Type</TableHead>
                    <TableHead className="hidden px-4 lg:table-cell">Affectations</TableHead>
                    <TableHead className="px-4 text-right">Présence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((personne) => (
                    <TableRow key={personne.id}>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
                              {initials(personne.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{personne.nom}</p>
                            <p className="truncate text-xs text-muted-foreground">{personne.email ?? "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 md:table-cell">
                        <span className={portalChipClass}>{typeLabel(personne.type)}</span>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 lg:table-cell">
                        <p className="max-w-sm text-sm text-muted-foreground">
                          {personne.affectations.join(" · ") || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <div className="inline-flex flex-wrap justify-end rounded-2xl border border-border bg-muted/40 p-1">
                            {(["PRESENT", "ABSENT", "RETARD"] as const).map((statut) => {
                              const active = personne.statut === statut;
                              return (
                                <Button
                                  key={statut}
                                  type="button"
                                  size="sm"
                                  variant={active ? "default" : "ghost"}
                                  disabled={locked || busyAll}
                                  title={locked ? "Liste déjà enregistrée" : STATUT_LABEL[statut]}
                                  className={
                                    active && statut === "ABSENT"
                                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      : active && statut === "RETARD"
                                        ? "bg-amber-600 text-white hover:bg-amber-700"
                                        : undefined
                                  }
                                  aria-pressed={active}
                                  onClick={() => setStatut(personne.id, statut)}
                                >
                                  {STATUT_LABEL[statut]}
                                </Button>
                              );
                            })}
                          </div>
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
        </>
      )}

      <ConfirmDialog
        open={tousPresentsOpen}
        onOpenChange={setTousPresentsOpen}
        title="Marquer toute l’équipe présente ?"
        description="Les statuts locaux seront remis à Présent. Cliquez ensuite sur Enregistrer pour valider définitivement."
        confirmText="Tous présents"
        isLoading={busyAll}
        onConfirm={markAllPresent}
      />
    </div>
  );
}
