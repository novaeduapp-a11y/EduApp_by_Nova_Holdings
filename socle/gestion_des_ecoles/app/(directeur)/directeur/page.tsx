"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  portalCardClass,
  portalChipClass,
  portalKpiClass,
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Liste = {
  id: string;
  eleve?: string;
  nom?: string;
  classe?: string;
  motif?: string | null;
  titre?: string;
  detail?: string | null;
};

type Bilan = {
  date: string;
  ecole: { nom: string; ville: string } | null;
  eleves: { total: number; absents: number; retards: number };
  personnel: { total: number; absents: number; retards: number; presents: number };
  listes: {
    absencesEleves: Liste[];
    retardsEleves: Liste[];
    absencesPersonnel: Liste[];
    retardsPersonnel: Liste[];
    perturbations: Liste[];
  };
  alertes: { id: string; titre: string; date: string }[];
  agenda: { id: string; titre: string; corps: string }[];
};

type Onglet = "eleves" | "personnel" | "perturbations";
type FiltreStatut = "" | "ABSENT" | "RETARD";
type Ligne = Liste & { statut: "ABSENT" | "RETARD" };

const PAGE_SIZE = 30;

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

function withStatut(items: Liste[], statut: "ABSENT" | "RETARD"): Ligne[] {
  return items.map((item) => ({ ...item, statut }));
}

function ligneLabel(item: Ligne) {
  if (item.eleve) return item.classe ? `${item.eleve} · ${item.classe}` : item.eleve;
  if (item.nom) return item.nom;
  return item.titre ?? "—";
}

export default function DirecteurBilanPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [data, setData] = useState<Bilan | null>(null);
  const [date, setDate] = useState(todayIso);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("eleves");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Liste | null>(null);

  const load = useCallback(async (nextDate: string, mode: "full" | "soft" = "full") => {
    if (mode === "full") setStatus("loading");
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/staff/direction/bilan?date=${encodeURIComponent(nextDate)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setData(body.data);
      if (body.data?.date) setDate(body.data.date);
      setStatus("ready");
    } catch {
      if (mode === "full") {
        setData(null);
        setStatus("error");
      } else {
        toast({ variant: "destructive", title: "Impossible d’actualiser le bilan" });
      }
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void load(todayIso(), "full");
  }, [load]);

  const changeDate = (next: string) => {
    if (!next || next === date) return;
    setDate(next);
    setPage(1);
    void load(next, status === "ready" ? "soft" : "full");
  };

  const openListe = (next: Onglet, statut: FiltreStatut = "") => {
    setOnglet(next);
    setFiltreStatut(statut);
    setPage(1);
    document.getElementById("listes-du-jour")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addPerturbation = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/direction/bilan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, detail, date }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const n = body.data?.envoyes ?? 0;
      toast({
        title: "Alerte publiée",
        description:
          n > 0
            ? `${n} destinataire${n > 1 ? "s" : ""} notifié${n > 1 ? "s" : ""}.`
            : "Visible sur ce bilan.",
      });
      setTitre("");
      setDetail("");
      setCreateOpen(false);
      setOnglet("perturbations");
      await load(date, "soft");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enregistrement refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/direction/bilan?id=${encodeURIComponent(toDelete.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({ title: "Alerte retirée" });
      setToDelete(null);
      await load(date, "soft");
    } catch {
      toast({ variant: "destructive", title: "Impossible de retirer cette alerte" });
    } finally {
      setBusy(false);
    }
  };

  const prenom = session?.user?.prenom ?? "";
  const listes = data?.listes;
  const eleves = useMemo(
    () => [...withStatut(listes?.absencesEleves ?? [], "ABSENT"), ...withStatut(listes?.retardsEleves ?? [], "RETARD")],
    [listes]
  );
  const personnel = useMemo(
    () => [
      ...withStatut(listes?.absencesPersonnel ?? [], "ABSENT"),
      ...withStatut(listes?.retardsPersonnel ?? [], "RETARD"),
    ],
    [listes]
  );

  const lignes = onglet === "eleves" ? eleves : onglet === "personnel" ? personnel : [];
  const q = search.trim().toLowerCase();
  const filteredLignes = lignes.filter((item) => {
    if (filtreStatut && item.statut !== filtreStatut) return false;
    if (!q) return true;
    return ligneLabel(item).toLowerCase().includes(q) || (item.motif ?? item.detail ?? "").toLowerCase().includes(q);
  });
  const filteredPerturbations = (listes?.perturbations ?? []).filter((item) => {
    if (!q) return true;
    return `${item.titre ?? ""} ${item.detail ?? ""}`.toLowerCase().includes(q);
  });

  const activeItems = onglet === "perturbations" ? filteredPerturbations : filteredLignes;
  const pageCount = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = activeItems.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = activeItems.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, activeItems.length);

  const kpis = data
    ? [
        {
          onglet: "eleves" as const,
          statut: "ABSENT" as FiltreStatut,
          value: data.eleves.absents,
          label: "Absences élèves",
          detail: "Appel professeur",
        },
        {
          onglet: "eleves" as const,
          statut: "RETARD" as FiltreStatut,
          value: data.eleves.retards,
          label: "Retards élèves",
          detail: "Appel professeur",
        },
        {
          onglet: "personnel" as const,
          statut: "ABSENT" as FiltreStatut,
          value: data.personnel.absents,
          label: "Absences profs",
          detail: "Saisie Direction",
        },
        {
          onglet: "personnel" as const,
          statut: "RETARD" as FiltreStatut,
          value: data.personnel.retards,
          label: "Retards profs",
          detail: "Saisie Direction",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {prenom ? `Bonjour, ${prenom}` : "Direction"}
            {data?.ecole ? ` · ${data.ecole.nom}` : ""}
          </p>
          <h1 className="mt-1 text-balance text-[30px] font-bold leading-9 tracking-tight">Bilan du jour</h1>
          <p className={`${portalMutedClass} mt-1 capitalize`}>{formatJour(date)}</p>
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
              aria-label="Date du bilan"
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
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus />
            Publier une alerte
          </Button>
        </div>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger le bilan.</p>
          <Button type="button" onClick={() => load(date, "full")}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${refreshing ? "opacity-70" : ""}`}>
          {kpis.map((kpi) => {
            const active = onglet === kpi.onglet && filtreStatut === kpi.statut;
            return (
              <button
                key={kpi.label}
                type="button"
                onClick={() => openListe(kpi.onglet, kpi.statut)}
                className={`${portalCardClass} text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? "ring-2 ring-primary" : ""
                }`}
              >
                <p className={portalKpiClass}>{kpi.value}</p>
                <h2 className={`${portalTitleClass} mt-1`}>{kpi.label}</h2>
                <p className={`${portalMutedClass} mt-1`}>{kpi.detail}</p>
              </button>
            );
          })}
        </div>
      )}

      {data ? (
        <p className={portalMutedClass}>
          {data.personnel.presents} professeur{data.personnel.presents > 1 ? "s" : ""} présent
          {data.personnel.presents > 1 ? "s" : ""} sur {data.personnel.total}
          {" · "}
          <Link href="/directeur/personnel" className={portalLinkClass}>
            Voir le personnel
          </Link>
          {" · "}
          <Link href="/directeur/apercu" className={portalLinkClass}>
            Aperçu établissement
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={portalPanelClass}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className={portalTitleClass}>Communiqués urgents</h2>
            <Link href="/directeur/communiques" className={`text-sm ${portalLinkClass}`}>
              Publier
            </Link>
          </div>
          {status === "loading" ? (
            <Skeleton className="h-20" />
          ) : (data?.alertes ?? []).length === 0 ? (
            <p className={portalMutedClass}>Aucun communiqué urgent aujourd’hui.</p>
          ) : (
            <ul className="space-y-2">
              {(data?.alertes ?? []).map((item) => (
                <li key={item.id} className="rounded-2xl bg-muted px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{item.titre}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString("fr-FR")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={portalPanelClass}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className={portalTitleClass}>Agenda</h2>
            <Link href="/directeur/agenda" className={`text-sm ${portalLinkClass}`}>
              Ouvrir
            </Link>
          </div>
          {status === "loading" ? (
            <Skeleton className="h-20" />
          ) : (data?.agenda ?? []).length === 0 ? (
            <p className={portalMutedClass}>Aucune note pour cette date.</p>
          ) : (
            <ul className="space-y-2">
              {(data?.agenda ?? []).map((item) => (
                <li key={item.id} className="rounded-2xl bg-muted px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{item.titre}</p>
                  {item.corps ? <p className="text-xs text-muted-foreground">{item.corps}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section id="listes-du-jour" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "eleves", label: "Élèves" },
              { id: "personnel", label: "Personnel" },
              { id: "perturbations", label: `Alertes${data ? ` (${data.listes.perturbations.length})` : ""}` },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={onglet === tab.id ? "default" : "outline"}
              aria-pressed={onglet === tab.id}
              onClick={() => {
                setOnglet(tab.id);
                setFiltreStatut("");
                setPage(1);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={
                onglet === "perturbations"
                  ? "Rechercher une alerte…"
                  : onglet === "personnel"
                    ? "Rechercher un professeur…"
                    : "Rechercher un élève…"
              }
              className="pl-9"
              aria-label="Rechercher dans la liste du jour"
            />
          </div>
          {onglet !== "perturbations" ? (
            <select
              className="edu-select"
              aria-label="Filtrer par statut"
              value={filtreStatut}
              onChange={(e) => {
                setFiltreStatut(e.target.value as FiltreStatut);
                setPage(1);
              }}
            >
              <option value="">Absents et retards</option>
              <option value="ABSENT">Absents</option>
              <option value="RETARD">Retards</option>
            </select>
          ) : null}
        </div>

        <div className={portalPanelClass}>
          {status === "loading" ? (
            <Skeleton className="h-32" />
          ) : pageItems.length === 0 ? (
            <p className={portalMutedClass}>
              {onglet === "perturbations"
                ? "Rien à signaler pour cette date."
                : onglet === "personnel"
                  ? "Aucune absence ni aucun retard du personnel. Saisissez le statut sur Personnel."
                  : "Aucun élève absent ou en retard. Les absences viennent de l’appel professeur."}
            </p>
          ) : onglet === "perturbations" ? (
            <ul className="space-y-2">
              {(pageItems as Liste[]).map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-muted px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.titre}</p>
                    {item.detail ? <p className="text-xs text-muted-foreground">{item.detail}</p> : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Retirer ${item.titre ?? "l’alerte"}`}
                    onClick={() => setToDelete(item)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {(pageItems as Ligne[]).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{ligneLabel(item)}</p>
                  <span className={portalChipClass}>{item.statut === "RETARD" ? "Retard" : "Absent"}</span>
                </li>
              ))}
            </ul>
          )}

          {activeItems.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={portalMutedClass}>
                {from}–{to} sur {activeItems.length} · {PAGE_SIZE} par page
              </p>
              {activeItems.length > PAGE_SIZE ? (
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
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publier une alerte</DialogTitle>
            <DialogDescription>
              Parents et professeurs reçoivent une alerte urgente. Visible sur ce bilan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Coupure d’eau" />
            </div>
            <div className="space-y-1.5">
              <Label>Détail</Label>
              <Textarea
                rows={3}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Récréation écourtée"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={addPerturbation} disabled={busy || titre.trim().length < 3}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={`Retirer ${toDelete?.titre ?? "cette alerte"} ?`}
        description="Elle disparaît du bilan. Les notifications déjà envoyées restent chez les destinataires."
        confirmText="Retirer"
        variant="destructive"
        isLoading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
