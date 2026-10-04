"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { matchesEleveSearch, uniqueNiveaux } from "@/lib/eleve-filter";
import { useToast } from "@/hooks/use-toast";
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
};

type Statut = "PRESENT" | "ABSENT" | "RETARD";

type Ligne = {
  eleveId: string;
  nom: string;
  prenom: string;
  matricule: string;
  sexe?: "M" | "F";
  statut: Statut;
  justifiee?: boolean;
};

const PAGE_SIZE = 30;

const STATUT_LABEL: Record<Statut, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  RETARD: "Retard",
};

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

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function snapshotOf(lignes: Ligne[]) {
  return JSON.stringify(lignes.map((ligne) => ({ id: ligne.eleveId, statut: ligne.statut })));
}

export default function ProfesseurAppelPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <ProfesseurAppelForm />
    </Suspense>
  );
}

function ProfesseurAppelForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const classeFromUrl = searchParams.get("classeId") ?? "";

  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState(classeFromUrl);
  const [date, setDate] = useState(todayIso);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [snapshot, setSnapshot] = useState("[]");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sheetStatus, setSheetStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreSexe, setFiltreSexe] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [page, setPage] = useState(1);
  const [tousPresentsOpen, setTousPresentsOpen] = useState(false);
  const [pending, setPending] = useState<{ type: "classe" | "date"; value: string } | null>(null);

  const dirty = snapshotOf(lignes) !== snapshot;

  const loadClasses = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/prof/classes");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const list = (body.data ?? []) as Classe[];
      setClasses(list);
      setClasseId((current) => {
        if (current && list.some((item) => item.id === current)) return current;
        if (classeFromUrl && list.some((item) => item.id === classeFromUrl)) return classeFromUrl;
        return list[0]?.id ?? "";
      });
      setStatus("ready");
    } catch {
      setClasses([]);
      setStatus("error");
    }
  }, [classeFromUrl]);

  const loadSheet = useCallback(async (nextClasseId: string, nextDate: string) => {
    if (!nextClasseId) {
      setLignes([]);
      setSnapshot("[]");
      setSheetStatus("ready");
      return;
    }
    setSheetStatus("loading");
    try {
      const res = await fetch(
        `/api/staff/prof/appel?classeId=${encodeURIComponent(nextClasseId)}&date=${nextDate}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const list = (body.data.eleves ?? []) as Ligne[];
      setLignes(list);
      setSnapshot(snapshotOf(list));
      setSheetStatus("ready");
    } catch {
      setLignes([]);
      setSnapshot("[]");
      setSheetStatus("error");
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (status !== "ready") return;
    loadSheet(classeId, date);
  }, [status, classeId, date, loadSheet]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreSexe, filtreStatut, classeId, date]);

  const niveaux = useMemo(() => uniqueNiveaux(classes), [classes]);
  const classesFiltrees = useMemo(
    () => (filtreNiveau ? classes.filter((item) => item.niveau === filtreNiveau) : classes),
    [classes, filtreNiveau]
  );
  const classe = classes.find((item) => item.id === classeId);

  const filtered = useMemo(
    () =>
      lignes.filter((ligne) => {
        if (filtreSexe && ligne.sexe !== filtreSexe) return false;
        if (filtreStatut && ligne.statut !== filtreStatut) return false;
        return matchesEleveSearch(ligne, search);
      }),
    [lignes, search, filtreSexe, filtreStatut]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const presents = lignes.filter((ligne) => ligne.statut === "PRESENT").length;
  const absents = lignes.filter((ligne) => ligne.statut === "ABSENT").length;
  const retards = lignes.filter((ligne) => ligne.statut === "RETARD").length;

  const requestClasse = (next: string) => {
    if (next === classeId) return;
    if (dirty) setPending({ type: "classe", value: next });
    else setClasseId(next);
  };

  const requestDate = (next: string) => {
    if (!next || next === date) return;
    if (dirty) setPending({ type: "date", value: next });
    else setDate(next);
  };

  const applyPending = () => {
    if (!pending) return;
    if (pending.type === "classe") setClasseId(pending.value);
    else setDate(pending.value);
    setPending(null);
  };

  const setStatut = (eleveId: string, next: Statut) => {
    setLignes((current) =>
      current.map((ligne) => (ligne.eleveId === eleveId ? { ...ligne, statut: next } : ligne))
    );
  };

  const save = async () => {
    if (!classeId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff/prof/appel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId,
          date,
          lignes: lignes.map((ligne) => ({ eleveId: ligne.eleveId, statut: ligne.statut })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setSnapshot(snapshotOf(lignes));
      toast({
        title: "Feuille d’appel enregistrée",
        description: `${body.data?.parentsNotifies ?? 0} parent(s) notifié(s) · le bilan direction se met à jour.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enregistrement impossible",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Appel</h1>
          <p className={`${portalMutedClass} mt-1 capitalize`}>
            {classe ? `${classe.nom} · ${formatJour(date)}` : "Présent, absent ou retard — vos classes uniquement."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setTousPresentsOpen(true)}
            disabled={lignes.length === 0 || presents === lignes.length}
          >
            Tous présents
          </Button>
          <Button type="button" onClick={save} disabled={saving || lignes.length === 0 || !dirty}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Enregistrer
          </Button>
        </div>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        niveaux={niveaux}
        niveau={filtreNiveau}
        onNiveauChange={(next) => {
          setFiltreNiveau(next);
          const list = next ? classes.filter((item) => item.niveau === next) : classes;
          if (list.length && !list.some((item) => item.id === classeId)) {
            requestClasse(list[0].id);
          }
        }}
        classes={classesFiltrees}
        classeId={classeId}
        onClasseChange={(next) => {
          if (!next) return;
          requestClasse(next);
        }}
        sexe={filtreSexe}
        onSexeChange={setFiltreSexe}
        extra={
          <>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Jour précédent"
                onClick={() => requestDate(shiftDate(date, -1))}
              >
                <ChevronLeft />
              </Button>
              <Input
                type="date"
                aria-label="Date de l’appel"
                className="w-[11.5rem]"
                value={date}
                onChange={(e) => requestDate(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Jour suivant"
                onClick={() => requestDate(shiftDate(date, 1))}
              >
                <ChevronRight />
              </Button>
            </div>
            {date !== todayIso() ? (
              <Button type="button" variant="outline" onClick={() => requestDate(todayIso())}>
                Aujourd’hui
              </Button>
            ) : null}
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
          <p className="text-sm leading-6 text-foreground">Impossible de charger vos classes.</p>
          <Button type="button" onClick={loadClasses}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : classes.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucune classe affectée</p>
          <p className={`${portalMutedClass} mt-1`}>
            Le préfet doit vous affecter une matière avant de faire l’appel.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <span className={portalChipClass}>{presents} présent{presents > 1 ? "s" : ""}</span>
            <span className={portalChipClass}>{absents} absent{absents > 1 ? "s" : ""}</span>
            <span className={portalChipClass}>{retards} retard{retards > 1 ? "s" : ""}</span>
            {dirty ? <span className={portalChipClass}>Non enregistré</span> : null}
          </div>

          {sheetStatus === "error" ? (
            <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
              <p className="text-sm leading-6 text-foreground">Impossible de charger la feuille d’appel.</p>
              <Button type="button" onClick={() => loadSheet(classeId, date)}>
                Réessayer
              </Button>
            </div>
          ) : sheetStatus === "loading" ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : filtered.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className={portalMutedClass}>
                {lignes.length === 0
                  ? "Aucun élève dans cette classe."
                  : "Aucun élève ne correspond à la recherche."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4">Élève</TableHead>
                    <TableHead className="px-4 text-right">Présence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((ligne) => (
                    <TableRow key={ligne.eleveId}>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
                              {initials(ligne.prenom, ligne.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {ligne.prenom} {ligne.nom}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {ligne.matricule}
                              {ligne.justifiee && ligne.statut !== "PRESENT" ? " · Justifiée" : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <div className="inline-flex rounded-2xl border border-border bg-muted/40 p-1">
                            {(["PRESENT", "ABSENT", "RETARD"] as const).map((statut) => {
                              const active = ligne.statut === statut;
                              return (
                                <Button
                                  key={statut}
                                  type="button"
                                  size="sm"
                                  variant={active ? "default" : "ghost"}
                                  className={
                                    active && statut === "ABSENT"
                                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      : active && statut === "RETARD"
                                        ? "bg-amber-600 text-white hover:bg-amber-700"
                                        : undefined
                                  }
                                  aria-pressed={active}
                                  onClick={() => setStatut(ligne.eleveId, statut)}
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
        title="Marquer toute la classe présente ?"
        description="Les absences et retards déjà cochés pour cette date seront remplacés. Pensez à enregistrer ensuite."
        confirmText="Tous présents"
        onConfirm={() => {
          setLignes((current) => current.map((ligne) => ({ ...ligne, statut: "PRESENT" })));
          setTousPresentsOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Quitter sans enregistrer ?"
        description="Les changements de cette feuille d’appel seront perdus."
        confirmText="Quitter"
        variant="destructive"
        onConfirm={applyPending}
      />
    </div>
  );
}
