"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { matchesEleveSearch, uniqueNiveaux } from "@/lib/eleve-filter";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Eleve = {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string;
  classe: { id?: string; nom: string; niveau: string };
};
type Bulletin = {
  id: string;
  eleveId: string;
  periodeId: string;
  eleve: string;
  classe: string;
  classeId: string;
  niveau: string;
  periode: string;
  date: string;
};
type Periode = { id: string; nom: string; actif: boolean };
type Appreciation = { eleveId: string; periodeId: string; appreciation: string };

const PAGE_SIZE = 30;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function PrefetBulletinsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <PrefetBulletinsForm />
    </Suspense>
  );
}

function PrefetBulletinsForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const eleveFromUrl = searchParams.get("eleveId") ?? "";
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [filtrePeriode, setFiltrePeriode] = useState("");
  const [eleveId, setEleveId] = useState(eleveFromUrl);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [appreciation, setAppreciation] = useState("");
  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreClasse, setFiltreClasse] = useState("");
  const [dialogSearch, setDialogSearch] = useState("");
  const [dialogNiveau, setDialogNiveau] = useState("");
  const [dialogClasse, setDialogClasse] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    const [eRes, bRes] = await Promise.all([
      fetch("/api/staff/prefet/eleves"),
      fetch("/api/staff/prefet/bulletins"),
    ]);
    const e = await eRes.json();
    const b = await bRes.json();
    if (!eRes.ok) throw new Error(e.error);
    if (!bRes.ok) throw new Error(b.error);
    const list = (e.data ?? []) as Eleve[];
    setEleves(list);
    setEleveId((current) => current || eleveFromUrl || list[0]?.id || "");
    setBulletins(b.data?.bulletins ?? []);
    setAppreciations(b.data?.appreciations ?? []);
    const pers = (b.data?.periodes ?? []) as Periode[];
    setPeriodes(pers);
    setPeriodeId((current) => {
      const active = pers.find((p) => p.actif);
      if (current && pers.some((p) => p.id === current && p.actif)) return current;
      return active?.id || "";
    });
    return list;
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      const list = await load();
      setStatus("ready");
      return list;
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les bulletins" });
      return [];
    }
  };

  useEffect(() => {
    refresh().then((list) => {
      if (eleveFromUrl) openCreate(eleveFromUrl, list);
    });
  }, []);

  const niveaux = useMemo(() => uniqueNiveaux(eleves.map((eleve) => eleve.classe)), [eleves]);
  const classesOptions = useMemo(
    () =>
      [
        ...new Map(
          eleves.map((eleve) => [
            eleve.classe.id || eleve.classe.nom,
            { id: eleve.classe.id || eleve.classe.nom, nom: eleve.classe.nom, niveau: eleve.classe.niveau },
          ])
        ).values(),
      ],
    [eleves]
  );
  const elevesDialog = useMemo(() => {
    return eleves.filter((eleve) => {
      if (dialogNiveau && eleve.classe.niveau !== dialogNiveau) return false;
      if (dialogClasse && (eleve.classe.id || eleve.classe.nom) !== dialogClasse) return false;
      return matchesEleveSearch(eleve, dialogSearch);
    });
  }, [eleves, dialogNiveau, dialogClasse, dialogSearch]);
  const periodeVue = filtrePeriode || periodes.find((periode) => periode.actif)?.id || "";
  const elevesFiltres = useMemo(() => {
    return eleves.filter((eleve) => {
      if (filtreNiveau && eleve.classe.niveau !== filtreNiveau) return false;
      if (filtreClasse && (eleve.classe.id || eleve.classe.nom) !== filtreClasse) return false;
      return matchesEleveSearch(eleve, search);
    });
  }, [eleves, search, filtreNiveau, filtreClasse]);

  const pageCount = Math.max(1, Math.ceil(elevesFiltres.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const elevesPage = elevesFiltres.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = elevesFiltres.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, elevesFiltres.length);

  useEffect(() => {
    setPage(1);
  }, [search, filtreNiveau, filtreClasse, filtrePeriode]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    if (!formOpen) return;
    if (eleveId && !elevesDialog.some((eleve) => eleve.id === eleveId) && elevesDialog[0]) {
      setEleveId(elevesDialog[0].id);
    }
  }, [elevesDialog, eleveId, formOpen]);

  useEffect(() => {
    const existing = appreciations.find((item) => item.eleveId === eleveId && item.periodeId === periodeId);
    setAppreciation(existing?.appreciation ?? "");
  }, [eleveId, periodeId, appreciations]);

  const dejaGenere = bulletins.some((item) => item.eleveId === eleveId && item.periodeId === periodeId);
  const periodeChoisie = periodes.find((item) => item.id === periodeId);
  const periodeActive = periodeChoisie?.actif === true;

  const openCreate = (targetId?: string, liste?: Eleve[]) => {
    const source = liste ?? eleves;
    const cible = source.find((eleve) => eleve.id === targetId);
    setDialogSearch("");
    if (cible) {
      setDialogNiveau(cible.classe.niveau);
      setDialogClasse(cible.classe.id || cible.classe.nom);
      setEleveId(cible.id);
    } else {
      setDialogNiveau(filtreNiveau);
      setDialogClasse(filtreClasse);
    }
    const active = periodes.find((periode) => periode.actif);
    if (active) setPeriodeId(active.id);
    setFormOpen(true);
  };

  const generateOne = async (targetId: string, appreciationText?: string) => {
    const res = await fetch("/api/staff/prefet/bulletins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eleveId: targetId, periodeId, appreciation: appreciationText ?? "" }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    return body;
  };

  const generate = async () => {
    if (!periodeActive) {
      toast({
        variant: "destructive",
        title: "Trimestre inactif",
        description: "On ne peut générer un bulletin que pour la période active.",
      });
      return;
    }
    setBusy(true);
    try {
      const body = await generateOne(eleveId, appreciation);
      toast({
        title: dejaGenere ? "Bulletin régénéré" : "Bulletin généré",
        description:
          body.data.parentsNotifies > 0
            ? "Le parent est notifié dans EduParent."
            : "Aucun parent lié à cet élève — rattachez un e-mail à l’inscription.",
      });
      setFormOpen(false);
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Génération impossible",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const generateClasse = async () => {
    if (!periodeActive) {
      toast({
        variant: "destructive",
        title: "Trimestre inactif",
        description: "On ne peut générer un bulletin que pour la période active.",
      });
      return;
    }
    if (!filtreClasse) {
      toast({
        variant: "destructive",
        title: "Choisissez une classe",
        description: "Filtrez d’abord la classe, puis générez élève par élève ou toute la classe.",
      });
      return;
    }
    const cibles = eleves.filter((eleve) => (eleve.classe.id || eleve.classe.nom) === filtreClasse);
    if (cibles.length === 0) return;
    setBusy(true);
    try {
      let ok = 0;
      for (const eleve of cibles) {
        await generateOne(eleve.id);
        ok += 1;
      }
      toast({ title: `${ok} bulletin${ok > 1 ? "s" : ""} généré${ok > 1 ? "s" : ""}` });
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Génération de classe interrompue",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Bulletins</h1>
          <p className={`${portalMutedClass} mt-1`}>
            PDF du cycle, un élève ou toute une classe. Notification du parent dans EduParent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={generateClasse}
            disabled={busy || eleves.length === 0 || !filtreClasse || !periodeActive}
          >
            Générer la classe
          </Button>
          <Button type="button" onClick={() => openCreate()} disabled={eleves.length === 0}>
            <Plus className="h-4 w-4" aria-hidden />
            Générer un élève
          </Button>
        </div>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un élève, une classe, une période…"
        niveaux={niveaux}
        niveau={filtreNiveau}
        onNiveauChange={setFiltreNiveau}
        classes={classesOptions}
        classeId={filtreClasse}
        onClasseChange={setFiltreClasse}
        extra={
          <select
            className="edu-select"
            aria-label="Filtrer par période"
            value={filtrePeriode}
            onChange={(e) => setFiltrePeriode(e.target.value)}
          >
            <option value="">Toutes les périodes</option>
            {periodes.map((periode) => (
              <option key={periode.id} value={periode.id}>
                {periode.nom}
              </option>
            ))}
          </select>
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les bulletins.</p>
          <Button type="button" onClick={refresh}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : elevesFiltres.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>
            {eleves.length === 0 ? "Aucun élève dans ce cycle." : "Aucun élève ne correspond à la recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Élève</TableHead>
                <TableHead className="px-4">Classe</TableHead>
                <TableHead className="hidden px-4 sm:table-cell">Bulletin</TableHead>
                <TableHead className="px-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elevesPage.map((eleve) => {
                const bulletin = bulletins.find(
                  (item) => item.eleveId === eleve.id && item.periodeId === periodeVue
                );
                return (
                  <TableRow key={eleve.id}>
                    <TableCell className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">
                        {eleve.prenom} {eleve.nom}
                      </p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {bulletin ? "PDF généré" : "Pas encore généré"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <span className={portalChipClass}>{eleve.classe.nom}</span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                      {bulletin ? (
                        <span className={portalChipClass}>
                          {new Date(bulletin.date).toLocaleDateString("fr-FR")}
                        </span>
                      ) : (
                        <span className={portalMutedClass}>Pas encore généré</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        {bulletin ? (
                          <Button asChild variant="ghost" size="icon">
                            <a
                              href={`/api/staff/prefet/bulletins/${bulletin.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Ouvrir le PDF de ${eleve.prenom} ${eleve.nom}`}
                            >
                              <FileText />
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!periodeActive || busy}
                          onClick={() => openCreate(eleve.id)}
                        >
                          {bulletin ? "Régénérer" : "Générer"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {elevesFiltres.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={portalMutedClass}>
                {from}–{to} sur {elevesFiltres.length} · {PAGE_SIZE} par page
              </p>
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
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dejaGenere ? "Régénérer le bulletin" : "Générer un bulletin"}</DialogTitle>
            <DialogDescription>
              Cherchez l’élève, puis choisissez la période. L’appréciation apparaît sur le PDF ; vide, un texte automatique est utilisé.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <EleveToolbar
              search={dialogSearch}
              onSearchChange={setDialogSearch}
              placeholder="Nom, prénom ou matricule…"
              niveaux={niveaux}
              niveau={dialogNiveau}
              onNiveauChange={setDialogNiveau}
              classes={classesOptions}
              classeId={dialogClasse}
              onClasseChange={setDialogClasse}
            />
            <div>
              <p className="mb-1.5 text-sm font-medium">Élève</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-3xl bg-secondary/70 p-2">
                {elevesDialog.map((eleve) => {
                  const selected = eleve.id === eleveId;
                  return (
                    <li key={eleve.id}>
                      <button
                        type="button"
                        onClick={() => setEleveId(eleve.id)}
                        className={`flex w-full min-h-11 items-center justify-between gap-3 rounded-2xl px-3 text-left text-sm transition-[background-color,color] duration-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selected
                            ? "bg-card font-semibold text-foreground shadow-card"
                            : "text-foreground hover:bg-card/70"
                        }`}
                        aria-pressed={selected}
                      >
                        <span>
                          {eleve.prenom} {eleve.nom}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {eleve.classe.nom}
                          {eleve.matricule ? ` · ${eleve.matricule}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {elevesDialog.length === 0 ? (
                <p className={`${portalMutedClass} mt-2`}>Aucun élève ne correspond à la recherche.</p>
              ) : null}
            </div>
            <Field label="Période">
              <select className="edu-select w-full" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)}>
                {periodes.map((periode) => (
                  <option key={periode.id} value={periode.id} disabled={!periode.actif}>
                    {periode.nom}
                    {periode.actif ? " · actif" : " · fermé"}
                  </option>
                ))}
              </select>
              {!periodeActive ? (
                <p className={`${portalMutedClass} mt-1`}>
                  Seul le trimestre actif peut recevoir un nouveau bulletin. Les PDF déjà générés restent consultables.
                </p>
              ) : null}
            </Field>
            <Field label="Appréciation générale">
              <Textarea
                rows={4}
                placeholder="Laissée vide, un texte automatique sera utilisé sur le PDF."
                value={appreciation}
                onChange={(e) => setAppreciation(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={generate}
              disabled={busy || !eleveId || !periodeActive || elevesDialog.length === 0}
            >
              {busy ? "Génération…" : dejaGenere ? "Régénérer le PDF" : "Générer le PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
