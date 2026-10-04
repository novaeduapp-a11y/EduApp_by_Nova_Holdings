"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Note = {
  id: string;
  titre: string;
  corps: string;
  date: string;
  auteur: string;
};

const PAGE_SIZE = 30;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatJour(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortAgenda(notes: Note[], today: string) {
  const upcoming = notes
    .filter((note) => note.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.titre.localeCompare(b.titre, "fr"));
  const past = notes
    .filter((note) => note.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre, "fr"));
  return [...upcoming, ...past];
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function DirecteurAgendaPage() {
  const { toast } = useToast();
  const today = todayIso();
  const [notes, setNotes] = useState<Note[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtrePeriode, setFiltrePeriode] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [reading, setReading] = useState<Note | null>(null);
  const [toDelete, setToDelete] = useState<Note | null>(null);
  const [form, setForm] = useState({ titre: "", corps: "", date: today });

  const load = async () => {
    const res = await fetch("/api/staff/direction/agenda");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setNotes(body.data ?? []);
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger l’agenda" });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const sorted = useMemo(() => sortAgenda(notes, today), [notes, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((note) => {
      if (filtrePeriode === "today" && note.date !== today) return false;
      if (filtrePeriode === "upcoming" && note.date <= today) return false;
      if (filtrePeriode === "past" && note.date >= today) return false;
      if (!q) return true;
      return `${note.titre} ${note.corps} ${note.auteur}`.toLowerCase().includes(q);
    });
  }, [sorted, search, filtrePeriode, today]);

  useEffect(() => {
    setPage(1);
  }, [search, filtrePeriode]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const todayCount = notes.filter((note) => note.date === today).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ titre: "", corps: "", date: today });
    setFormOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setForm({ titre: note.titre, corps: note.corps, date: note.date });
    setFormOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const url = editing
        ? `/api/staff/direction/agenda?id=${encodeURIComponent(editing.id)}`
        : "/api/staff/direction/agenda";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: editing ? "Note mise à jour" : "Note ajoutée",
        description:
          form.date === today
            ? "Visible sur le bilan du jour."
            : "Elle apparaîtra sur le bilan à la date choisie.",
      });
      setFormOpen(false);
      setEditing(null);
      setReading(null);
      setForm({ titre: "", corps: "", date: today });
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: editing ? "Modification refusée" : "Ajout refusé",
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
      const res = await fetch(`/api/staff/direction/agenda?id=${encodeURIComponent(toDelete.id)}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Note retirée" });
      setToDelete(null);
      setReading(null);
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

  const canSave = form.titre.trim().length >= 3 && form.corps.trim().length >= 3;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Agenda</h1>
          <p className={`${portalMutedClass} mt-1`}>
            Notes et rappels de direction
            {status === "ready" ? ` · ${notes.length} note${notes.length > 1 ? "s" : ""}` : ""}.
            {todayCount > 0 ? ` ${todayCount} aujourd’hui.` : ""} Les notes du jour apparaissent sur le{" "}
            <Link href="/directeur" className="font-medium text-primary">
              bilan
            </Link>
            .
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouvelle note
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une note…"
            className="pl-9"
            aria-label="Rechercher une note"
          />
        </div>
        <select
          className="edu-select"
          aria-label="Filtrer par période"
          value={filtrePeriode}
          onChange={(e) => setFiltrePeriode(e.target.value)}
        >
          <option value="">Toutes les dates</option>
          <option value="today">Aujourd’hui</option>
          <option value="upcoming">À venir</option>
          <option value="past">Passées</option>
        </select>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger l’agenda.</p>
          <Button type="button" onClick={() => refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : notes.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucune note d’agenda</p>
          <p className={`${portalMutedClass} mt-1`}>Ajoutez un rappel : il remontera sur le bilan du jour.</p>
          <Button type="button" className="mt-4" onClick={openCreate}>
            Nouvelle note
          </Button>
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
                <TableHead>Titre</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((note) => {
                const isToday = note.date === today;
                return (
                  <TableRow key={note.id}>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span>{formatJour(note.date)}</span>
                        {isToday ? (
                          <span className="inline-flex min-h-9 w-fit items-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary">
                            Aujourd’hui · bilan
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="max-w-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setReading(note)}
                      >
                        <span className={portalTitleClass}>{note.titre}</span>
                        <span className={`${portalMutedClass} mt-1 line-clamp-1 block`}>{note.corps}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className={portalChipClass}>{note.auteur}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Modifier ${note.titre}`}
                          onClick={() => openEdit(note)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Retirer ${note.titre}`}
                          onClick={() => setToDelete(note)}
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
        </>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setForm({ titre: "", corps: "", date: today });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
            <DialogDescription>
              {form.date === today
                ? "Cette note apparaît tout de suite sur le bilan du jour."
                : "Elle apparaîtra sur le bilan à la date choisie."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Titre">
              <Input
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Conseil de classe"
                maxLength={120}
              />
            </Field>
            <Field label="Rappel">
              <Textarea
                rows={5}
                value={form.corps}
                onChange={(e) => setForm({ ...form, corps: e.target.value })}
                placeholder="Heure, lieu, ce qu’il faut préparer."
                maxLength={2000}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={save} disabled={!canSave || busy}>
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reading} onOpenChange={(open) => !open && setReading(null)}>
        <DialogContent className="sm:max-w-lg">
          {reading ? (
            <>
              <DialogHeader>
                <DialogTitle>{reading.titre}</DialogTitle>
                <DialogDescription>
                  {formatJour(reading.date)} · Par {reading.auteur}
                </DialogDescription>
              </DialogHeader>
              {reading.date === today ? (
                <span className="inline-flex min-h-9 w-fit items-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary">
                  Aujourd’hui · bilan
                </span>
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{reading.corps}</p>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setToDelete(reading)}
                >
                  Retirer
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setReading(null)}>
                    Fermer
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      openEdit(reading);
                      setReading(null);
                    }}
                  >
                    Modifier
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={toDelete ? `Retirer « ${toDelete.titre} » ?` : "Retirer la note ?"}
        description="Elle disparaît de l’agenda et du bilan du jour correspondant."
        confirmText="Retirer la note"
        cancelText="Annuler"
        variant="destructive"
        isLoading={busy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
