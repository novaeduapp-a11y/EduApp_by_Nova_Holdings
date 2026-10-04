"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { uniqueNiveaux } from "@/lib/eleve-filter";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Affectation = {
  id?: string;
  matiereId: string;
  matiere: string;
  professeurId: string | null;
  professeur: string | null;
  coefficient?: number;
};

type Classe = {
  id: string;
  nom: string;
  niveau: string;
  effectif: number;
  effectifMax: number;
  salle: string | null;
  professeurPrincipalId: string | null;
  professeurPrincipal: string | null;
  affectations: Affectation[];
};

type Option = { id: string; nom: string; matiereIds?: string[] };

const PAGE_SIZE = 30;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function PrefetClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [matieres, setMatieres] = useState<Option[]>([]);
  const [professeurs, setProfesseurs] = useState<Option[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Classe | null>(null);
  const [toDelete, setToDelete] = useState<Classe | null>(null);
  const [create, setCreate] = useState({
    nom: "",
    niveau: "",
    effectifMax: "40",
    salle: "",
    professeurPrincipalId: "",
  });
  const [createAffectations, setCreateAffectations] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState({
    nom: "",
    effectifMax: "40",
    salle: "",
    professeurPrincipalId: "",
  });
  const [matiereId, setMatiereId] = useState("");
  const [professeurId, setProfesseurId] = useState("");

  const load = async () => {
    const res = await fetch("/api/staff/prefet/classes");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    const list = (body.data?.classes ?? []) as Classe[];
    const niv = (body.data?.niveaux ?? []) as string[];
    const mats = (body.data?.matieres ?? []) as Option[];
    const profs = (body.data?.professeurs ?? []) as Option[];
    setClasses(list);
    setNiveaux(niv);
    setMatieres(mats);
    setProfesseurs(profs);
    setCreate((prev) => ({ ...prev, niveau: prev.niveau || niv[0] || "" }));
    setMatiereId((current) => current || mats[0]?.id || "");
    setProfesseurId((current) => current || profs[0]?.id || "");
    return list;
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les classes" });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const niveauxListe = useMemo(
    () => uniqueNiveaux(classes.length ? classes : niveaux.map((item) => ({ niveau: item }))),
    [classes, niveaux]
  );
  const classesFiltrees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((classe) => {
      if (filtreNiveau && classe.niveau !== filtreNiveau) return false;
      if (!q) return true;
      return (
        classe.nom.toLowerCase().includes(q) ||
        classe.niveau.toLowerCase().includes(q) ||
        (classe.salle ?? "").toLowerCase().includes(q) ||
        (classe.professeurPrincipal ?? "").toLowerCase().includes(q)
      );
    });
  }, [classes, search, filtreNiveau]);

  const pageCount = Math.max(1, Math.ceil(classesFiltrees.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const classesPage = classesFiltrees.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = classesFiltrees.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, classesFiltrees.length);

  useEffect(() => {
    setPage(1);
  }, [search, filtreNiveau]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const openCreate = () => {
    setCreate({
      nom: "",
      niveau: filtreNiveau || niveaux[0] || "",
      effectifMax: "40",
      salle: "",
      professeurPrincipalId: "",
    });
    setCreateAffectations({});
    setCreateOpen(true);
  };

  const openEdit = (classe: Classe) => {
    setEditing(classe);
    setEdit({
      nom: classe.nom,
      effectifMax: String(classe.effectifMax),
      salle: classe.salle ?? "",
      professeurPrincipalId: classe.professeurPrincipalId ?? "",
    });
  };

  const submitCreate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: create.nom,
          niveau: create.niveau,
          effectifMax: Number(create.effectifMax) || 40,
          salle: create.salle || undefined,
          professeurPrincipalId: create.professeurPrincipalId || null,
          affectations: Object.entries(createAffectations)
            .filter(([, professeurId]) => professeurId)
            .map(([matiereId, professeurId]) => ({ matiereId, professeurId })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: `Classe ${body.data.nom} créée`,
        description: "Affectez ensuite un professeur pour l’EDT et le portail prof.",
      });
      setCreateOpen(false);
      const list = await load();
      setStatus("ready");
      const created = list.find((item) => item.id === body.data.id);
      if (created) openEdit(created);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Création refusée",
        description: error instanceof Error ? error.message : "Hors de votre cycle",
      });
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId: editing.id,
          nom: edit.nom,
          salle: edit.salle,
          effectifMax: Number(edit.effectifMax) || 40,
          professeurPrincipalId: edit.professeurPrincipalId || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Classe mise à jour" });
      const list = await load();
      setStatus("ready");
      const next = list.find((item) => item.id === editing.id);
      if (next) openEdit(next);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Mise à jour refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const affecter = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/classes/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classeId: editing.id, matiereId, professeurId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Affectation enregistrée" });
      const list = await load();
      setStatus("ready");
      const next = list.find((item) => item.id === editing.id);
      if (next) openEdit(next);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Affectation refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const retirer = async (idMatiere: string) => {
    if (!editing) return;
    const res = await fetch(
      `/api/staff/prefet/classes/affectations?classeId=${encodeURIComponent(editing.id)}&matiereId=${encodeURIComponent(idMatiere)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast({ variant: "destructive", title: "Retrait refusé" });
      return;
    }
    const list = await load();
    const next = list.find((item) => item.id === editing.id);
    if (next) openEdit(next);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/prefet/classes?id=${encodeURIComponent(toDelete.id)}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: `${toDelete.nom} a été supprimée.` });
      setToDelete(null);
      if (editing?.id === toDelete.id) setEditing(null);
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Suppression refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const selected = editing ? classes.find((item) => item.id === editing.id) ?? editing : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Classes</h1>
          <p className={`${portalMutedClass} mt-1`}>
            {status === "ready"
              ? `${classes.length} classe${classes.length > 1 ? "s" : ""} dans votre cycle.`
              : "Création limitée aux niveaux du cycle, puis affectation des professeurs."}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouvelle classe
        </Button>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher une classe, un niveau, une salle…"
        niveaux={niveauxListe}
        niveau={filtreNiveau}
        onNiveauChange={setFiltreNiveau}
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les classes.</p>
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
      ) : classesFiltrees.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>
            {classes.length === 0
              ? "Aucune classe dans ce cycle. Créez-en une pour inscrire des élèves."
              : "Aucune classe ne correspond à la recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Classe</TableHead>
                <TableHead className="px-4">Niveau</TableHead>
                <TableHead className="hidden px-4 sm:table-cell">Salle</TableHead>
                <TableHead className="px-4">Effectif</TableHead>
                <TableHead className="hidden px-4 md:table-cell">Prof. principal</TableHead>
                <TableHead className="px-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classesPage.map((classe) => {
                const ratio = classe.effectifMax > 0 ? Math.min(100, (classe.effectif / classe.effectifMax) * 100) : 0;
                return (
                  <TableRow key={classe.id}>
                    <TableCell className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{classe.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {classe.affectations.length
                          ? `${classe.affectations.length} matière${classe.affectations.length > 1 ? "s" : ""}`
                          : "Aucune affectation"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <span className={portalChipClass}>{classe.niveau}</span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 text-muted-foreground sm:table-cell">
                      {classe.salle || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-foreground">
                          {classe.effectif}/{classe.effectifMax}
                        </span>
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary" aria-hidden>
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${ratio}%` }} />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 md:table-cell">
                      {classe.professeurPrincipal || (
                        <span className="text-muted-foreground">À renseigner</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Modifier ${classe.nom}`}
                          onClick={() => openEdit(classe)}
                        >
                          <Pencil />
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/prefet/eleves?classeId=${classe.id}`} aria-label={`Élèves de ${classe.nom}`}>
                            <Users />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/prefet/edt?classeId=${classe.id}`} aria-label={`Emploi du temps de ${classe.nom}`}>
                            <Calendar />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Supprimer ${classe.nom}`}
                          disabled={classe.effectif > 0}
                          onClick={() => setToDelete(classe)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {classesFiltrees.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={portalMutedClass}>
                {from}–{to} sur {classesFiltrees.length} · {PAGE_SIZE} par page
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle classe</DialogTitle>
            <DialogDescription>
              Renseignez la fiche, puis les autres professeurs de la classe (obligatoire au collège).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <Input placeholder="CM1-A" value={create.nom} onChange={(e) => setCreate({ ...create, nom: e.target.value })} />
            </Field>
            <Field label="Niveau">
              <select
                className="edu-select w-full"
                value={create.niveau}
                onChange={(e) => setCreate({ ...create, niveau: e.target.value })}
              >
                {niveaux.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Effectif max">
              <Input
                type="number"
                min={10}
                max={80}
                value={create.effectifMax}
                onChange={(e) => setCreate({ ...create, effectifMax: e.target.value })}
              />
            </Field>
            <Field label="Salle">
              <Input placeholder="A12" value={create.salle} onChange={(e) => setCreate({ ...create, salle: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Professeur principal">
                <select
                  className="edu-select w-full"
                  value={create.professeurPrincipalId}
                  onChange={(e) => setCreate({ ...create, professeurPrincipalId: e.target.value })}
                >
                  <option value="">Aucun</option>
                  {professeurs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <p className="font-semibold text-foreground">Autres professeurs</p>
            <p className={portalMutedClass}>
              Pour chaque matière, choisissez le professeur qui l’enseignera dans cette classe.
            </p>
            <ul className="space-y-2">
              {matieres.map((matiere) => {
                const candidats = professeurs.filter(
                  (p) => !p.matiereIds?.length || p.matiereIds.includes(matiere.id)
                );
                return (
                  <li key={matiere.id} className="grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                    <span className="text-sm font-medium">{matiere.nom}</span>
                    <select
                      className="edu-select w-full"
                      value={createAffectations[matiere.id] ?? ""}
                      onChange={(e) =>
                        setCreateAffectations((current) => ({ ...current, [matiere.id]: e.target.value }))
                      }
                    >
                      <option value="">Non affecté</option>
                      {candidats.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submitCreate} disabled={busy || !create.nom}>
              {busy ? "Enregistrement…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier {selected?.nom}</DialogTitle>
            <DialogDescription>
              Sans matière + professeur, le prof ne voit pas la classe et l’EDT n’a rien à poser.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <Input value={edit.nom} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} />
            </Field>
            <Field label="Effectif max">
              <Input
                type="number"
                min={10}
                max={80}
                value={edit.effectifMax}
                onChange={(e) => setEdit({ ...edit, effectifMax: e.target.value })}
              />
            </Field>
            <Field label="Salle">
              <Input value={edit.salle} onChange={(e) => setEdit({ ...edit, salle: e.target.value })} />
            </Field>
            <Field label="Professeur principal">
              <select
                className="edu-select w-full"
                value={edit.professeurPrincipalId}
                onChange={(e) => setEdit({ ...edit, professeurPrincipalId: e.target.value })}
              >
                <option value="">Aucun</option>
                {professeurs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button type="button" variant="outline" onClick={submitEdit} disabled={busy || !edit.nom}>
            {busy ? "Enregistrement…" : "Enregistrer la fiche"}
          </Button>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="font-semibold text-foreground">Affectations</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Matière">
                <select className="edu-select min-w-[160px]" value={matiereId} onChange={(e) => setMatiereId(e.target.value)}>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Professeur du cycle">
                <select
                  className="edu-select min-w-[200px]"
                  value={professeurId}
                  onChange={(e) => setProfesseurId(e.target.value)}
                >
                  {professeurs
                    .filter((p) => !p.matiereIds?.length || p.matiereIds.includes(matiereId))
                    .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="button" onClick={affecter} disabled={busy || !matiereId || !professeurId}>
                Affecter
              </Button>
            </div>
            <ul className="space-y-2">
              {(selected?.affectations ?? []).map((a) => (
                <li
                  key={a.matiereId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    {a.matiere} · {a.professeur ?? "sans professeur"}
                    {a.coefficient != null ? (
                      <span className="ml-2 text-muted-foreground">coef. {a.coefficient}</span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-2">
                    {a.id ? (
                      <Input
                        type="number"
                        min={0.25}
                        max={20}
                        step={0.25}
                        className="h-9 w-20"
                        defaultValue={a.coefficient ?? 1}
                        disabled={busy}
                        onBlur={async (e) => {
                          const value = Number(e.target.value);
                          if (!a.id || !Number.isFinite(value) || value < 0.25 || value > 20) return;
                          if (value === a.coefficient) return;
                          setBusy(true);
                          try {
                            const res = await fetch("/api/staff/prefet/matieres/affectations", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ classeMatiereId: a.id, coefficient: value }),
                            });
                            const body = await res.json();
                            if (!res.ok) throw new Error(body.error);
                            toast({ title: "Coefficient enregistré" });
                            await load();
                          } catch (error) {
                            toast({
                              title: "Coefficient refusé",
                              description: error instanceof Error ? error.message : "Réessayez",
                              variant: "destructive",
                            });
                          } finally {
                            setBusy(false);
                          }
                        }}
                      />
                    ) : null}
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => retirer(a.matiereId)}>
                      Retirer
                    </Button>
                  </div>
                </li>
              ))}
              {selected && selected.affectations.length === 0 ? (
                <li className={portalMutedClass}>Affectez au moins une matière pour saisir l’emploi du temps.</li>
              ) : null}
            </ul>
            {professeurs.length === 0 ? (
              <p className="text-sm text-destructive">Aucun professeur de ce cycle dans l’établissement.</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={toDelete ? `Supprimer ${toDelete.nom} ?` : "Supprimer la classe ?"}
        description="Uniquement si la classe n’a plus d’élèves. Les créneaux EDT de cette classe seront aussi retirés."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        isLoading={busy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
