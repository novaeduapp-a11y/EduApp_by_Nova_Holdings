"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { uniqueNiveaux } from "@/lib/eleve-filter";
import { useToast } from "@/hooks/use-toast";
import { portalMutedClass, portalPanelClass, portalTitleClass } from "@/components/eduadmins/portal-shell";

type Classe = { id: string; nom: string; niveau: string; matieresCount?: number };
type Matiere = {
  id: string;
  nom: string;
  professeurId: string | null;
  professeur: string | null;
  affectee?: boolean;
};
type Professeur = { id: string; nom: string };
type Creneau = {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
  matiereId: string;
  matiere: string;
  professeur: string | null;
  professeurId?: string | null;
};
type Jour = { jour: string; label: string };
type Horaire = { heureDebut: string; heureFin: string };
type CellTarget = { jour: string; heureDebut: string; heureFin: string };

function cellKey(cell: CellTarget) {
  return `${cell.jour}|${cell.heureDebut}|${cell.heureFin}`;
}

function sameCell(a: CellTarget, b: CellTarget) {
  return cellKey(a) === cellKey(b);
}

function normalizeHeure(value: string) {
  return value.slice(0, 5);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function PrefetEdtPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <PrefetEdtForm />
    </Suspense>
  );
}

function PrefetEdtForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const classeFromUrl = searchParams.get("classeId") ?? "";
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState("");
  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [jours, setJours] = useState<Jour[]>([]);
  const [horaires, setHoraires] = useState<Horaire[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Creneau | null>(null);
  const [toDelete, setToDelete] = useState<Creneau | null>(null);
  const [grilleDirty, setGrilleDirty] = useState(false);
  const horairesOriginRef = useRef<Horaire[]>([]);
  const [drag, setDrag] = useState<{
    slot: Creneau;
    copy: boolean;
    overKey: string | null;
    x: number;
    y: number;
  } | null>(null);
  const didDragRef = useRef(false);
  const [form, setForm] = useState({
    jour: "LUNDI",
    heureDebut: "08:00",
    heureFin: "09:00",
    matiereId: "",
    professeurId: "",
    salle: "",
  });

  const load = async (id?: string) => {
    const query = id ? `?classeId=${encodeURIComponent(id)}` : "";
    const res = await fetch(`/api/staff/prefet/edt${query}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setClasses(body.data.classes ?? []);
    setJours(body.data.jours ?? []);
    const nextHoraires = (body.data.horaires ?? []) as Horaire[];
    setHoraires(nextHoraires);
    horairesOriginRef.current = nextHoraires.map((slot) => ({ ...slot }));
    setGrilleDirty(false);
    setMatieres(body.data.matieres ?? []);
    setProfesseurs(body.data.professeurs ?? []);
    setCreneaux(body.data.creneaux ?? []);
    const nextId = body.data.classeId ?? "";
    setClasseId(nextId);

    const nextMatieres: Matiere[] = body.data.matieres ?? [];
    const firstMatiere = nextMatieres.find((m) => m.affectee) ?? nextMatieres[0];
    setForm((prev) => ({
      ...prev,
      jour: prev.jour || body.data.jours?.[0]?.jour || "LUNDI",
      heureDebut: prev.heureDebut || body.data.horaires?.[0]?.heureDebut || "08:00",
      heureFin: prev.heureFin || body.data.horaires?.[0]?.heureFin || "09:00",
      matiereId: prev.matiereId || firstMatiere?.id || "",
      professeurId: prev.professeurId || firstMatiere?.professeurId || "",
    }));
  };

  const refresh = async (id?: string) => {
    setStatus("loading");
    try {
      await load(id);
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger l’emploi du temps" });
    }
  };

  useEffect(() => {
    refresh(classeFromUrl || undefined);
  }, [classeFromUrl]);

  const niveaux = useMemo(() => uniqueNiveaux(classes), [classes]);
  const classesFiltrees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((classe) => {
      if (filtreNiveau && classe.niveau !== filtreNiveau) return false;
      if (!q) return true;
      return `${classe.nom} ${classe.niveau}`.toLowerCase().includes(q);
    });
  }, [classes, filtreNiveau, search]);

  useEffect(() => {
    if (!classeId || classesFiltrees.some((classe) => classe.id === classeId)) return;
    const next = classesFiltrees.find((c) => (c.matieresCount ?? 0) > 0)?.id ?? classesFiltrees[0]?.id;
    if (!next) return;
    setClasseId(next);
    load(next).catch(() => toast({ variant: "destructive", title: "Classe hors cycle" }));
  }, [classesFiltrees, classeId]);

  const cell = (jour: string, heureDebut: string, heureFin: string) =>
    creneaux.find((c) => c.jour === jour && c.heureDebut === heureDebut && c.heureFin === heureFin);

  const classeActive = classes.find((classe) => classe.id === classeId);
  const matiereActive = matieres.find((m) => m.id === form.matiereId);
  const peutAjouter = Boolean(classeId && matieres.length > 0 && professeurs.length > 0);
  const formValide =
    Boolean(classeId && form.matiereId && form.jour) &&
    Boolean(form.professeurId || matiereActive?.professeurId) &&
    normalizeHeure(form.heureDebut) < normalizeHeure(form.heureFin);

  const openCreate = (preset?: { jour: string; heureDebut: string; heureFin: string }) => {
    const firstMatiere = matieres.find((m) => m.affectee) ?? matieres[0];
    setEditing(null);
    setForm({
      jour: preset?.jour || jours[0]?.jour || "LUNDI",
      heureDebut: preset?.heureDebut || horaires[0]?.heureDebut || "08:00",
      heureFin: preset?.heureFin || horaires[0]?.heureFin || "09:00",
      matiereId: firstMatiere?.id || "",
      professeurId: firstMatiere?.professeurId || professeurs[0]?.id || "",
      salle: "",
    });
    setFormOpen(true);
  };

  const openEdit = (slot: Creneau) => {
    const matiere = matieres.find((m) => m.id === slot.matiereId);
    setEditing(slot);
    setForm({
      jour: slot.jour,
      heureDebut: slot.heureDebut,
      heureFin: slot.heureFin,
      matiereId: slot.matiereId,
      professeurId: slot.professeurId || matiere?.professeurId || "",
      salle: slot.salle ?? "",
    });
    setFormOpen(true);
  };

  const onMatiereChange = (matiereId: string) => {
    const matiere = matieres.find((m) => m.id === matiereId);
    setForm((prev) => ({
      ...prev,
      matiereId,
      professeurId: matiere?.professeurId || prev.professeurId || professeurs[0]?.id || "",
    }));
  };

  const save = async () => {
    if (!formValide) {
      toast({
        variant: "destructive",
        title: "Créneau incomplet",
        description: "Choisissez une matière, un professeur et des horaires valides.",
      });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        jour: form.jour,
        heureDebut: normalizeHeure(form.heureDebut),
        heureFin: normalizeHeure(form.heureFin),
        matiereId: form.matiereId,
        professeurId: form.professeurId || null,
        salle: form.salle || null,
      };
      const res = await fetch("/api/staff/prefet/edt", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : { ...payload, classeId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: editing ? "Créneau modifié" : "Créneau enregistré",
        description: editing ? undefined : "Visible dans EduParent et le planning du professeur.",
      });
      setFormOpen(false);
      setEditing(null);
      await load(classeId);
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: editing ? "Modification refusée" : "Créneau refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/prefet/edt?id=${encodeURIComponent(toDelete.id)}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Créneau retiré" });
      setToDelete(null);
      setFormOpen(false);
      setEditing(null);
      await load(classeId);
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

  const selectClasse = (next: string) => {
    setClasseId(next);
    load(next).catch(() => toast({ variant: "destructive", title: "Classe hors cycle" }));
  };

  const applyDrop = async (source: Creneau, target: CellTarget, copy: boolean) => {
    if (busy) return;
    if (sameCell(source, target)) return;

    const occupant = cell(target.jour, target.heureDebut, target.heureFin);

    if (copy && occupant) {
      toast({
        variant: "destructive",
        title: "Case occupée",
        description: "Recopiez ce cours sur une case vide.",
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/edt", {
        method: copy ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          copy
            ? {
                classeId,
                jour: target.jour,
                heureDebut: target.heureDebut,
                heureFin: target.heureFin,
                matiereId: source.matiereId,
                professeurId: source.professeurId,
                salle: source.salle,
              }
            : occupant
              ? { id: source.id, swapWithId: occupant.id }
              : {
                  id: source.id,
                  jour: target.jour,
                  heureDebut: target.heureDebut,
                  heureFin: target.heureFin,
                }
        ),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: copy ? "Créneau recopié" : occupant ? "Créneaux échangés" : "Créneau déplacé",
      });
      await load(classeId);
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: copy ? "Copie refusée" : "Déplacement refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const beginSlotDrag = (event: ReactPointerEvent<HTMLButtonElement>, slot: Creneau) => {
    if (event.button !== 0 || busy) return;

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let started = false;
    let copy = event.altKey || event.ctrlKey || event.metaKey;

    const readCell = (x: number, y: number): CellTarget | null => {
      const node = document.elementFromPoint(x, y)?.closest("[data-edt-cell]") as HTMLElement | null;
      if (!node?.dataset.edtJour || !node.dataset.edtDebut || !node.dataset.edtFin) return null;
      return { jour: node.dataset.edtJour, heureDebut: node.dataset.edtDebut, heureFin: node.dataset.edtFin };
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      copy = ev.altKey || ev.ctrlKey || ev.metaKey;
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (!started && dist < 12) return;
      started = true;
      didDragRef.current = true;
      ev.preventDefault();
      const over = readCell(ev.clientX, ev.clientY);
      setDrag({
        slot,
        copy,
        overKey: over ? cellKey(over) : null,
        x: ev.clientX,
        y: ev.clientY,
      });
    };

    const endDrag = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("keydown", onEscape);
      const over = started ? readCell(ev.clientX, ev.clientY) : null;
      setDrag(null);
      if (!started) {
        openEdit(slot);
        return;
      }
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
      if (over) void applyDrop(slot, over, copy);
    };

    const onEscape = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("keydown", onEscape);
      started = true;
      didDragRef.current = false;
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("keydown", onEscape);
  };

  const updateHoraire = (index: number, field: "heureDebut" | "heureFin", value: string) => {
    const normalized = normalizeHeure(value);
    if (!/^\d{2}:\d{2}$/.test(normalized)) return;
    setHoraires((current) => {
      const prev = current[index];
      if (!prev) return current;
      const next = { ...prev, [field]: normalized };
      if (prev.heureDebut === next.heureDebut && prev.heureFin === next.heureFin) return current;
      setCreneaux((slots) =>
        slots.map((slot) =>
          slot.heureDebut === prev.heureDebut && slot.heureFin === prev.heureFin
            ? { ...slot, heureDebut: next.heureDebut, heureFin: next.heureFin }
            : slot
        )
      );
      return current.map((item, i) => (i === index ? next : item));
    });
    setGrilleDirty(true);
  };

  const saveGrille = async () => {
    const valid = horaires.filter(
      (slot) => slot.heureDebut && slot.heureFin && slot.heureDebut < slot.heureFin
    );
    if (valid.length === 0) {
      toast({ variant: "destructive", title: "Indiquez au moins une heure de cours" });
      return;
    }
    const origin = horairesOriginRef.current;
    const remaps = valid
      .map((to, index) => {
        const from = origin[index];
        if (!from) return null;
        return { from, to };
      })
      .filter((item): item is { from: Horaire; to: Horaire } => Boolean(item));

    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/edt/grille", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horaires: valid, remaps }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Heures du cycle enregistrées" });
      setGrilleDirty(false);
      await load(classeId);
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Grille refusée",
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
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Emploi du temps</h1>
          <p className={`${portalMutedClass} mt-1`}>
            Grille lundi–vendredi
            {classeActive ? ` · ${classeActive.nom}` : ""}
            {status === "ready" ? ` · ${creneaux.length} créneau${creneaux.length > 1 ? "x" : ""}` : ""}.
            Visible dans EduParent.
          </p>
          {status === "ready" && creneaux.length > 0 ? (
            <p className={`${portalMutedClass} mt-1`}>
              Glissez un cours vers une autre case pour le déplacer. Option ou Ctrl + glisser pour le recopier.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setHoraires((current) => [...current, { heureDebut: "16:00", heureFin: "17:00" }]);
              setGrilleDirty(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter une heure
          </Button>
          {grilleDirty ? (
            <Button type="button" variant="outline" onClick={saveGrille} disabled={busy}>
              Enregistrer les heures
            </Button>
          ) : null}
          <Button type="button" onClick={() => openCreate()} disabled={!peutAjouter}>
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter un créneau
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une classe…"
            className="pl-9"
            aria-label="Rechercher une classe"
          />
        </div>
        <select
          className="edu-select"
          aria-label="Filtrer par niveau"
          value={filtreNiveau}
          onChange={(e) => setFiltreNiveau(e.target.value)}
        >
          <option value="">Tous les niveaux</option>
          {niveaux.map((niveau) => (
            <option key={niveau} value={niveau}>
              {niveau}
            </option>
          ))}
        </select>
        <select
          className="edu-select min-w-[200px]"
          aria-label="Classe"
          value={classeId}
          onChange={(e) => selectClasse(e.target.value)}
        >
          {classesFiltrees.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nom} · {classe.niveau}
              {(classe.matieresCount ?? 0) === 0 ? " · à compléter" : ""}
            </option>
          ))}
        </select>
        <Link
          href="/prefet/classes"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Gérer les classes
        </Link>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger l’emploi du temps.</p>
          <Button type="button" onClick={() => refresh(classeId || undefined)}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-96" />
      ) : classes.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucune classe dans votre cycle</p>
          <p className={`${portalMutedClass} mt-1`}>
            <Link href="/prefet/classes" className="font-medium text-primary underline-offset-4 hover:underline">
              Créer une classe
            </Link>{" "}
            pour poser l’emploi du temps.
          </p>
        </div>
      ) : classesFiltrees.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>Aucune classe ne correspond à la recherche.</p>
        </div>
      ) : !peutAjouter ? (
        <div className={portalPanelClass}>
          <p className="text-sm leading-6 text-foreground">
            {matieres.length === 0
              ? "Aucune matière n’est disponible pour l’établissement."
              : "Aucun professeur de votre cycle n’est encore créé."}{" "}
            <Link href="/prefet/classes" className="font-medium text-primary underline-offset-4 hover:underline">
              Ouvrir les classes
            </Link>{" "}
            pour compléter, puis revenez ici.
          </p>
        </div>
      ) : (
        <>
          {(classeActive?.matieresCount ?? 0) === 0 ? (
            <div className={portalPanelClass}>
              <p className="text-sm leading-6 text-foreground">
                Cette classe n’a pas encore d’affectation. Vous pouvez quand même ajouter un créneau : la matière et le
                professeur seront liés automatiquement.
              </p>
            </div>
          ) : null}

          <div className={`overflow-x-auto rounded-3xl bg-card shadow-card ${drag ? "select-none" : ""}`}>
            <p className="sr-only" aria-live="polite">
              {drag
                ? drag.copy
                  ? `Recopie de ${drag.slot.matiere}. Relâchez sur une case vide.`
                  : `Déplacement de ${drag.slot.matiere}. Relâchez sur une autre case.`
                : ""}
            </p>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="w-28 px-4 py-3 font-medium text-muted-foreground">Horaire</th>
                  {jours.map((j) => (
                    <th key={j.jour} className="px-3 py-3 font-semibold text-foreground">
                      {j.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horaires.map((h, index) => (
                  <tr key={`horaire-row-${index}`} className="align-top">
                    <td className="px-2 py-2">
                      <div className="flex min-w-[11rem] flex-col gap-1">
                        <Input
                          type="time"
                          aria-label="Début du créneau"
                          className="h-9 tabular-nums"
                          value={h.heureDebut}
                          onChange={(e) => updateHoraire(index, "heureDebut", e.target.value)}
                        />
                        <Input
                          type="time"
                          aria-label="Fin du créneau"
                          className="h-9 tabular-nums"
                          value={h.heureFin}
                          onChange={(e) => updateHoraire(index, "heureFin", e.target.value)}
                        />
                        <button
                          type="button"
                          className="text-left text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setHoraires((current) => current.filter((_, i) => i !== index));
                            horairesOriginRef.current = horairesOriginRef.current.filter(
                              (_, i) => i !== index
                            );
                            setGrilleDirty(true);
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    </td>
                    {jours.map((j) => {
                      const slot = cell(j.jour, h.heureDebut, h.heureFin);
                      const target = { jour: j.jour, heureDebut: h.heureDebut, heureFin: h.heureFin };
                      const isOver = drag?.overKey === cellKey(target);
                      const isSource = Boolean(slot && drag?.slot.id === slot.id);
                      return (
                        <td key={j.jour} className="p-2">
                          {slot ? (
                            <button
                              type="button"
                              data-edt-cell=""
                              data-edt-jour={j.jour}
                              data-edt-debut={h.heureDebut}
                              data-edt-fin={h.heureFin}
                              className={`min-h-[88px] w-full cursor-grab rounded-2xl bg-secondary/80 p-3 text-left touch-none transition-[background-color,box-shadow,opacity] duration-press hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing ${
                                isSource ? "opacity-40" : ""
                              } ${isOver ? "ring-2 ring-primary" : ""}`}
                              aria-label={`${slot.matiere}, ${j.label} ${h.heureDebut}. Glisser pour déplacer, cliquer pour modifier.`}
                              onPointerDown={(event) => beginSlotDrag(event, slot)}
                            >
                              <p className={portalTitleClass}>{slot.matiere}</p>
                              <p className={`${portalMutedClass} mt-1 text-xs`}>
                                {[slot.professeur, slot.salle].filter(Boolean).join(" · ") || "—"}
                              </p>
                            </button>
                          ) : (
                            <button
                              type="button"
                              data-edt-cell=""
                              data-edt-jour={j.jour}
                              data-edt-debut={h.heureDebut}
                              data-edt-fin={h.heureFin}
                              className={`group flex min-h-[88px] w-full items-center justify-center rounded-2xl border border-dashed text-muted-foreground transition-[background-color,color,box-shadow] duration-press hover:bg-secondary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                                isOver
                                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary"
                                  : "border-border"
                              }`}
                              aria-label={`Ajouter un créneau ${j.label} ${h.heureDebut}`}
                              onClick={() => {
                                if (didDragRef.current) return;
                                openCreate({ jour: j.jour, heureDebut: h.heureDebut, heureFin: h.heureFin });
                              }}
                            >
                              <Plus className="h-4 w-4 opacity-40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le créneau" : "Ajouter un créneau"}</DialogTitle>
            <DialogDescription>
              {classeActive ? `${classeActive.nom} · ${classeActive.niveau}. ` : ""}
              Choisissez la matière et le professeur : l’affectation est créée si besoin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jour">
              <select className="edu-select w-full" value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value })}>
                {jours.map((j) => (
                  <option key={j.jour} value={j.jour}>
                    {j.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Matière">
              <select className="edu-select w-full" value={form.matiereId} onChange={(e) => onMatiereChange(e.target.value)}>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                    {m.affectee && m.professeur ? ` · ${m.professeur}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Professeur">
              <select
                className="edu-select w-full"
                value={form.professeurId}
                onChange={(e) => setForm({ ...form, professeurId: e.target.value })}
              >
                <option value="">Choisir un professeur</option>
                {professeurs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Salle">
              <Input placeholder="A1" value={form.salle} onChange={(e) => setForm({ ...form, salle: e.target.value })} />
            </Field>
            <Field label="Début">
              <Input
                type="time"
                value={normalizeHeure(form.heureDebut)}
                onChange={(e) => setForm({ ...form, heureDebut: normalizeHeure(e.target.value) })}
              />
            </Field>
            <Field label="Fin">
              <Input
                type="time"
                value={normalizeHeure(form.heureFin)}
                onChange={(e) => setForm({ ...form, heureFin: normalizeHeure(e.target.value) })}
              />
            </Field>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setToDelete(editing)}
                disabled={busy}
              >
                Retirer
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={save} disabled={busy || !formValide}>
                {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {drag ? (
        <div
          className="pointer-events-none fixed z-50 w-44 rounded-2xl bg-card p-3 shadow-card"
          style={{ left: drag.x + 12, top: drag.y + 12 }}
        >
          <p className={portalTitleClass}>{drag.slot.matiere}</p>
          <p className={`${portalMutedClass} mt-1 text-xs`}>{drag.copy ? "Recopier" : "Déplacer"}</p>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={toDelete ? `Retirer ${toDelete.matiere} ?` : "Retirer le créneau ?"}
        description="Le créneau disparaît de EduParent et du planning du professeur."
        confirmText="Retirer le créneau"
        cancelText="Annuler"
        variant="destructive"
        isLoading={busy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
