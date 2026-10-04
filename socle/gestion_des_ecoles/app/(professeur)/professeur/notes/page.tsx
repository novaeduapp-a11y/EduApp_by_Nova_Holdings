"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
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
import { matchesEleveSearch, uniqueNiveaux } from "@/lib/eleve-filter";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type TypeEval = "DEVOIR" | "COMPOSITION" | "INTERROGATION" | "TP";

type Evaluation = {
  id: string;
  titre: string;
  type: TypeEval;
  noteSur: number;
  coefficient: number;
  date: string;
  classe: { id: string; nom: string; niveau?: string };
  matiere: { id: string; nom: string };
  periode: { id: string; nom: string } | null;
  notesSaisies: number;
  effectif: number;
};

type Affectation = {
  id: string;
  nom: string;
  niveau?: string;
  effectif?: number;
  matieres: { id: string; nom: string }[];
};

type Periode = { id: string; nom: string; actif: boolean };

type EleveNote = {
  eleveId: string;
  nom: string;
  prenom: string;
  matricule: string;
  sexe?: "M" | "F";
  note: number | null;
  absent: boolean;
};

type CreateForm = {
  titre: string;
  type: TypeEval;
  classeId: string;
  matiereId: string;
  periodeId: string;
  date: string;
  coefficient: string;
  noteSur: string;
};

type EditForm = {
  titre: string;
  type: TypeEval;
  periodeId: string;
  date: string;
  coefficient: string;
  noteSur: string;
};

const PAGE_SIZE = 30;

const TYPE_LABEL: Record<TypeEval, string> = {
  DEVOIR: "Devoir",
  COMPOSITION: "Composition",
  INTERROGATION: "Interrogation",
  TP: "TP",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function emptyCreate(affectations: Affectation[], periodes: Periode[], classeId: string): CreateForm {
  const classe = affectations.find((item) => item.id === classeId) ?? affectations[0];
  return {
    titre: "",
    type: "DEVOIR",
    classeId: classe?.id ?? "",
    matiereId: classe?.matieres[0]?.id ?? "",
    periodeId: periodes.find((item) => item.actif)?.id ?? periodes[0]?.id ?? "",
    date: todayIso(),
    coefficient: "1",
    noteSur: "20",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function ProfesseurNotesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <ProfesseurNotesForm />
    </Suspense>
  );
}

function ProfesseurNotesForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const classeFromUrl = searchParams.get("classeId") ?? "";
  const openCreateFromUrl = searchParams.get("creer") === "1";

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [filtreClasse, setFiltreClasse] = useState(classeFromUrl);
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreMatiere, setFiltreMatiere] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(openCreateFromUrl);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate([], [], classeFromUrl));
  const [editing, setEditing] = useState<Evaluation | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [toDelete, setToDelete] = useState<Evaluation | null>(null);

  const [selectedId, setSelectedId] = useState("");
  const [eleves, setEleves] = useState<EleveNote[]>([]);
  const [notes, setNotes] = useState<Record<string, { note: string; absent: boolean }>>({});
  const [notesSearch, setNotesSearch] = useState("");
  const [notesSexe, setNotesSexe] = useState("");
  const [notesPage, setNotesPage] = useState(1);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setStatus("loading");
    try {
      const res = await fetch("/api/staff/prof/evaluations");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const list = (body.data ?? []) as Evaluation[];
      const pers = (body.periodes ?? []) as Periode[];
      const affs = (body.affectations ?? []) as Affectation[];
      setEvaluations(list);
      setPeriodes(pers);
      setAffectations(affs);
      setCreateForm((prev) =>
        prev.classeId ? prev : emptyCreate(affs, pers, classeFromUrl || prev.classeId)
      );
      setStatus("ready");
    } catch {
      if (!opts?.silent) {
        setEvaluations([]);
        setStatus("error");
      }
    }
  }, [classeFromUrl]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (classeFromUrl) setFiltreClasse(classeFromUrl);
  }, [classeFromUrl]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreClasse, filtreNiveau, filtreMatiere, filtreType]);

  const selected = evaluations.find((item) => item.id === selectedId) ?? null;
  const createMatieres = affectations.find((item) => item.id === createForm.classeId)?.matieres ?? [];
  const niveaux = useMemo(() => uniqueNiveaux(affectations), [affectations]);
  const matieres = useMemo(() => {
    const map = new Map<string, string>();
    for (const classe of affectations) {
      for (const matiere of classe.matieres) map.set(matiere.id, matiere.nom);
    }
    return [...map.entries()]
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [affectations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return evaluations.filter((evaluation) => {
      if (filtreClasse && evaluation.classe.id !== filtreClasse) return false;
      if (filtreNiveau && evaluation.classe.niveau !== filtreNiveau) return false;
      if (filtreMatiere && evaluation.matiere.id !== filtreMatiere) return false;
      if (filtreType && evaluation.type !== filtreType) return false;
      if (!q) return true;
      return (
        evaluation.titre.toLowerCase().includes(q) ||
        evaluation.classe.nom.toLowerCase().includes(q) ||
        evaluation.matiere.nom.toLowerCase().includes(q) ||
        TYPE_LABEL[evaluation.type].toLowerCase().includes(q)
      );
    });
  }, [evaluations, search, filtreClasse, filtreNiveau, filtreMatiere, filtreType]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const elevesVisibles = useMemo(
    () =>
      eleves.filter((eleve) => {
        if (notesSexe && eleve.sexe !== notesSexe) return false;
        return matchesEleveSearch(eleve, notesSearch);
      }),
    [eleves, notesSearch, notesSexe]
  );
  const notesPageCount = Math.max(1, Math.ceil(elevesVisibles.length / PAGE_SIZE));
  const notesPageSafe = Math.min(notesPage, notesPageCount);
  const elevesPage = elevesVisibles.slice((notesPageSafe - 1) * PAGE_SIZE, notesPageSafe * PAGE_SIZE);
  const notesFrom = elevesVisibles.length === 0 ? 0 : (notesPageSafe - 1) * PAGE_SIZE + 1;
  const notesTo = Math.min(notesPageSafe * PAGE_SIZE, elevesVisibles.length);
  const saisies = eleves.filter((eleve) => {
    const row = notes[eleve.eleveId];
    return Boolean(row?.absent || (row?.note && row.note.trim() !== ""));
  }).length;

  const openCreate = () => {
    setCreateForm(emptyCreate(affectations, periodes, filtreClasse));
    setCreateOpen(true);
  };

  const openNotes = async (evaluation: Evaluation) => {
    setSelectedId(evaluation.id);
    setNotesSearch("");
    setNotesSexe("");
    setNotesPage(1);
    setLoadingEleves(true);
    try {
      const res = await fetch(`/api/staff/prof/evaluations/${evaluation.id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const list = (body.data?.eleves ?? []) as EleveNote[];
      setEleves(list);
      const initial: Record<string, { note: string; absent: boolean }> = {};
      for (const eleve of list) {
        initial[eleve.eleveId] = {
          note: eleve.note == null ? "" : String(eleve.note),
          absent: eleve.absent,
        };
      }
      setNotes(initial);
    } catch (error) {
      setSelectedId("");
      toast({
        variant: "destructive",
        title: "Impossible de charger les notes",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoadingEleves(false);
    }
  };

  const closeNotes = () => {
    setSelectedId("");
    setEleves([]);
    setNotes({});
  };

  const createEvaluation = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prof/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: createForm.titre,
          type: createForm.type,
          classeId: createForm.classeId,
          matiereId: createForm.matiereId,
          periodeId: createForm.periodeId || undefined,
          date: createForm.date,
          coefficient: Number(createForm.coefficient) || 1,
          noteSur: Number(createForm.noteSur) || 20,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Évaluation créée", description: "Vous pouvez maintenant saisir les notes." });
      setCreateOpen(false);
      await load({ silent: true });
      const created: Evaluation = {
        id: body.data.id,
        titre: createForm.titre,
        type: createForm.type,
        noteSur: Number(createForm.noteSur) || 20,
        coefficient: Number(createForm.coefficient) || 1,
        date: createForm.date,
        classe: affectations.find((item) => item.id === createForm.classeId) ?? { id: createForm.classeId, nom: "" },
        matiere: createMatieres.find((item) => item.id === createForm.matiereId) ?? {
          id: createForm.matiereId,
          nom: "",
        },
        periode: periodes.find((item) => item.id === createForm.periodeId) ?? null,
        notesSaisies: 0,
        effectif: affectations.find((item) => item.id === createForm.classeId)?.effectif ?? 0,
      };
      await openNotes(created);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Création impossible",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editForm) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/prof/evaluations/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: editForm.titre,
          type: editForm.type,
          periodeId: editForm.periodeId || undefined,
          date: editForm.date,
          coefficient: Number(editForm.coefficient) || 1,
          noteSur: Number(editForm.noteSur) || 20,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Évaluation mise à jour" });
      setEditing(null);
      setEditForm(null);
      await load({ silent: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Modification impossible",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const deleteEvaluation = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/prof/evaluations/${toDelete.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: `${toDelete.titre} a été supprimée.` });
      if (selectedId === toDelete.id) closeNotes();
      setToDelete(null);
      await load({ silent: true });
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

  const saveNotes = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/prof/evaluations/${selectedId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: eleves.map((eleve) => {
            const row = notes[eleve.eleveId];
            return {
              eleveId: eleve.eleveId,
              note: row?.absent || !row?.note ? null : Number(row.note),
              absent: row?.absent ?? false,
            };
          }),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: "Notes enregistrées",
        description: `${body.data?.parentsNotifies ?? 0} parent(s) notifié(s) · visibles dans EduParent et le bilan préfet.`,
      });
      setEvaluations((current) =>
        current.map((item) => (item.id === selectedId ? { ...item, notesSaisies: saisies } : item))
      );
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
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Notes</h1>
          <p className={`${portalMutedClass} mt-1`}>
            {status === "ready"
              ? `${evaluations.length} évaluation${evaluations.length > 1 ? "s" : ""} · les moyennes partent vers les parents et le préfet.`
              : "Créez une évaluation, puis saisissez les notes."}
          </p>
        </div>
        <Button type="button" onClick={openCreate} disabled={affectations.length === 0}>
          <Plus />
          Nouvelle évaluation
        </Button>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un titre, une classe ou une matière…"
        niveaux={niveaux}
        niveau={filtreNiveau}
        onNiveauChange={setFiltreNiveau}
        classes={affectations}
        classeId={filtreClasse}
        onClasseChange={setFiltreClasse}
        extra={
          <>
            {matieres.length > 1 ? (
              <select
                className="edu-select"
                aria-label="Filtrer par matière"
                value={filtreMatiere}
                onChange={(e) => setFiltreMatiere(e.target.value)}
              >
                <option value="">Toutes les matières</option>
                {matieres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nom}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              className="edu-select"
              aria-label="Filtrer par type"
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
            >
              <option value="">Tous les types</option>
              {(Object.keys(TYPE_LABEL) as TypeEval[]).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </>
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les évaluations.</p>
          <Button type="button" onClick={() => load()}>
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
            {evaluations.length === 0 ? "Aucune évaluation" : "Aucune évaluation ne correspond à la recherche."}
          </p>
          {evaluations.length === 0 ? (
            <p className={`${portalMutedClass} mt-1`}>
              {affectations.length === 0
                ? "Le préfet doit vous affecter une matière avant de créer une évaluation."
                : "Créez un devoir ou une composition pour commencer la saisie."}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Évaluation</TableHead>
                <TableHead className="px-4">Classe</TableHead>
                <TableHead className="hidden px-4 md:table-cell">Matière</TableHead>
                <TableHead className="hidden px-4 sm:table-cell">Date</TableHead>
                <TableHead className="px-4">Saisie</TableHead>
                <TableHead className="px-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((evaluation) => {
                const ratio =
                  evaluation.effectif > 0
                    ? Math.min(100, (evaluation.notesSaisies / evaluation.effectif) * 100)
                    : 0;
                return (
                  <TableRow
                    key={evaluation.id}
                    className="cursor-pointer"
                    onClick={() => openNotes(evaluation)}
                  >
                    <TableCell className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{evaluation.titre}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABEL[evaluation.type]} · coef. {evaluation.coefficient} · /{evaluation.noteSur}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <span className={portalChipClass}>{evaluation.classe.nom}</span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 md:table-cell">
                      {evaluation.matiere.nom}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 sm:table-cell text-muted-foreground">
                      {formatDate(evaluation.date)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-foreground">
                          {evaluation.notesSaisies}/{evaluation.effectif}
                        </span>
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary" aria-hidden>
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${ratio}%` }} />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Modifier ${evaluation.titre}`}
                          onClick={() => {
                            setEditing(evaluation);
                            setEditForm({
                              titre: evaluation.titre,
                              type: evaluation.type,
                              periodeId: evaluation.periode?.id ?? "",
                              date: evaluation.date.slice(0, 10),
                              coefficient: String(evaluation.coefficient),
                              noteSur: String(evaluation.noteSur),
                            });
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Supprimer ${evaluation.titre}`}
                          onClick={() => setToDelete(evaluation)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle évaluation</DialogTitle>
            <DialogDescription>Les notes saisies ensuite sont visibles par les parents.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Titre">
                <Input
                  placeholder="Devoir n°1 — fractions"
                  value={createForm.titre}
                  onChange={(e) => setCreateForm({ ...createForm, titre: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Type">
              <select
                className="edu-select w-full"
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as TypeEval })}
              >
                {(Object.keys(TYPE_LABEL) as TypeEval[]).map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
              />
            </Field>
            <Field label="Classe">
              <select
                className="edu-select w-full"
                value={createForm.classeId}
                onChange={(e) => {
                  const next = e.target.value;
                  const nextMatieres = affectations.find((item) => item.id === next)?.matieres ?? [];
                  setCreateForm({ ...createForm, classeId: next, matiereId: nextMatieres[0]?.id || "" });
                }}
              >
                {affectations.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Matière">
              <select
                className="edu-select w-full"
                value={createForm.matiereId}
                onChange={(e) => setCreateForm({ ...createForm, matiereId: e.target.value })}
              >
                {createMatieres.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Période">
              <select
                className="edu-select w-full"
                value={createForm.periodeId}
                onChange={(e) => setCreateForm({ ...createForm, periodeId: e.target.value })}
              >
                {periodes.map((periode) => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom}
                    {periode.actif ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Coefficient">
                <Input
                  type="number"
                  min={0.5}
                  max={10}
                  step="0.5"
                  value={createForm.coefficient}
                  onChange={(e) => setCreateForm({ ...createForm, coefficient: e.target.value })}
                />
              </Field>
              <Field label="Note sur">
                <Input
                  type="number"
                  min={5}
                  max={20}
                  value={createForm.noteSur}
                  onChange={(e) => setCreateForm({ ...createForm, noteSur: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={createEvaluation}
              disabled={busy || !createForm.titre || !createForm.classeId || !createForm.matiereId}
            >
              {busy ? "Enregistrement…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l’évaluation</DialogTitle>
            <DialogDescription>La classe et la matière restent celles de la création.</DialogDescription>
          </DialogHeader>
          {editForm ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Titre">
                  <Input
                    value={editForm.titre}
                    onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Type">
                <select
                  className="edu-select w-full"
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as TypeEval })}
                >
                  {(Object.keys(TYPE_LABEL) as TypeEval[]).map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABEL[type]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </Field>
              <Field label="Période">
                <select
                  className="edu-select w-full"
                  value={editForm.periodeId}
                  onChange={(e) => setEditForm({ ...editForm, periodeId: e.target.value })}
                >
                  {periodes.map((periode) => (
                    <option key={periode.id} value={periode.id}>
                      {periode.nom}
                      {periode.actif ? " (active)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Coefficient">
                  <Input
                    type="number"
                    min={0.5}
                    max={10}
                    step="0.5"
                    value={editForm.coefficient}
                    onChange={(e) => setEditForm({ ...editForm, coefficient: e.target.value })}
                  />
                </Field>
                <Field label="Note sur">
                  <Input
                    type="number"
                    min={5}
                    max={20}
                    value={editForm.noteSur}
                    onChange={(e) => setEditForm({ ...editForm, noteSur: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(null);
                setEditForm(null);
              }}
            >
              Annuler
            </Button>
            <Button type="button" onClick={saveEdit} disabled={busy || !editForm?.titre}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) closeNotes();
        }}
      >
        <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.titre ?? "Saisie des notes"}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.classe.nom} · ${selected.matiere.nom} · /${selected.noteSur} · ${saisies}/${eleves.length} saisies`
                : "Entrez une note ou marquez l’absence."}
            </DialogDescription>
          </DialogHeader>
          {loadingEleves ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <div className="space-y-4">
              <EleveToolbar
                search={notesSearch}
                onSearchChange={(value) => {
                  setNotesSearch(value);
                  setNotesPage(1);
                }}
                sexe={notesSexe}
                onSexeChange={(value) => {
                  setNotesSexe(value);
                  setNotesPage(1);
                }}
              />
              {elevesPage.length === 0 ? (
                <p className={`${portalMutedClass} py-6 text-center`}>
                  {eleves.length === 0 ? "Aucun élève dans cette classe." : "Aucun élève ne correspond à la recherche."}
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-3xl border border-border">
                  {elevesPage.map((eleve) => {
                    const row = notes[eleve.eleveId];
                    return (
                      <li key={eleve.eleveId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {eleve.prenom} {eleve.nom}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">{eleve.matricule}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={selected?.noteSur}
                            step="0.5"
                            className="w-24"
                            aria-label={`Note de ${eleve.prenom} ${eleve.nom}`}
                            value={row?.note ?? ""}
                            disabled={row?.absent}
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [eleve.eleveId]: { note: e.target.value, absent: false },
                              }))
                            }
                          />
                          <Button
                            type="button"
                            variant={row?.absent ? "secondary" : "outline"}
                            size="sm"
                            aria-pressed={row?.absent ?? false}
                            onClick={() =>
                              setNotes((prev) => ({
                                ...prev,
                                [eleve.eleveId]: {
                                  note: prev[eleve.eleveId]?.absent ? prev[eleve.eleveId]?.note ?? "" : "",
                                  absent: !prev[eleve.eleveId]?.absent,
                                },
                              }))
                            }
                          >
                            Absent
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {elevesVisibles.length > PAGE_SIZE ? (
                <div className="flex items-center justify-between gap-2">
                  <p className={portalMutedClass}>
                    {notesFrom}–{notesTo} sur {elevesVisibles.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Page précédente"
                      disabled={notesPageSafe <= 1}
                      onClick={() => setNotesPage((current) => Math.max(1, current - 1))}
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Page suivante"
                      disabled={notesPageSafe >= notesPageCount}
                      onClick={() => setNotesPage((current) => Math.min(notesPageCount, current + 1))}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeNotes}>
              Fermer
            </Button>
            <Button type="button" onClick={saveNotes} disabled={saving || eleves.length === 0}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={`Supprimer ${toDelete?.titre ?? "cette évaluation"} ?`}
        description="Les notes associées ne compteront plus dans les moyennes. Les parents ne verront plus cette évaluation."
        confirmText="Supprimer"
        variant="destructive"
        isLoading={busy}
        onConfirm={deleteEvaluation}
      />
    </div>
  );
}
