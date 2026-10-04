"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { FAMILLES_CYCLE } from "@/lib/constants";

type Destinataire = "PARENTS" | "PROFESSEURS" | "TOUS";
type FamilleCycle = keyof typeof FAMILLES_CYCLE;

type Communique = {
  id: string;
  titre: string;
  corps: string;
  urgent: boolean;
  destinataires: Destinataire;
  familleCycle: FamilleCycle | null;
  createdAt: string;
  auteur: string;
};

const PAGE_SIZE = 30;

const DESTINATAIRES: { value: Destinataire; label: string }[] = [
  { value: "PARENTS", label: "Parents de l’établissement" },
  { value: "PROFESSEURS", label: "Professeurs" },
  { value: "TOUS", label: "Parents et professeurs" },
];

const EMPTY_FORM = {
  titre: "",
  corps: "",
  urgent: false,
  destinataires: "PARENTS" as Destinataire,
};

function destLabel(value: Destinataire) {
  return DESTINATAIRES.find((item) => item.value === value)?.label ?? value;
}

function destPublishHint(value: Destinataire) {
  if (value === "PROFESSEURS") return "Les professeurs de l’établissement recevront une alerte.";
  if (value === "TOUS") {
    return "Les parents le verront dans EduParent. Les professeurs recevront une alerte.";
  }
  return "Les parents de tous les cycles le verront dans EduParent.";
}

function cycleLabel(value: FamilleCycle | null) {
  if (!value) return "Établissement";
  return FAMILLES_CYCLE[value]?.label ?? value;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function DirecteurCommuniquesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Communique[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtreDest, setFiltreDest] = useState("");
  const [filtreUrgent, setFiltreUrgent] = useState("");
  const [filtreCycle, setFiltreCycle] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [reading, setReading] = useState<Communique | null>(null);
  const [toDelete, setToDelete] = useState<Communique | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    const res = await fetch("/api/staff/direction/communiques");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setItems(body.data ?? []);
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les communiqués" });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filtreDest && item.destinataires !== filtreDest) return false;
      if (filtreUrgent === "urgent" && !item.urgent) return false;
      if (filtreUrgent === "normal" && item.urgent) return false;
      if (filtreCycle === "ecole" && item.familleCycle) return false;
      if (filtreCycle && filtreCycle !== "ecole" && item.familleCycle !== filtreCycle) return false;
      if (!q) return true;
      return `${item.titre} ${item.corps} ${item.auteur}`.toLowerCase().includes(q);
    });
  }, [items, search, filtreDest, filtreUrgent, filtreCycle]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreDest, filtreUrgent, filtreCycle]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const openCreate = (preset?: Partial<typeof EMPTY_FORM>) => {
    setForm({ ...EMPTY_FORM, ...preset });
    setFormOpen(true);
  };

  const publish = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/direction/communiques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const n = body.data.envoyes ?? 0;
      toast({
        title: "Communiqué publié",
        description:
          n === 0
            ? "Aucun destinataire trouvé pour cet établissement."
            : `${n} destinataire${n > 1 ? "s" : ""} notifié${n > 1 ? "s" : ""} (EduParent et/ou alertes professeurs).`,
      });
      setConfirmPublish(false);
      setFormOpen(false);
      setForm(EMPTY_FORM);
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Publication refusée",
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
      const res = await fetch(`/api/staff/direction/communiques?id=${encodeURIComponent(toDelete.id)}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Communiqué retiré" });
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

  const canPublish = form.titre.trim().length >= 3 && form.corps.trim().length >= 8;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Communiqués</h1>
          <p className={`${portalMutedClass} mt-1`}>
            Toute l’école
            {status === "ready" ? ` · ${items.length} communiqué${items.length > 1 ? "s" : ""}` : ""}.
            Un envoi parents apparaît dans EduParent. Les urgents remontent sur le{" "}
            <Link href="/directeur" className="font-medium text-primary">
              bilan du jour
            </Link>
            .
          </p>
        </div>
        <Button type="button" onClick={() => openCreate()}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouveau communiqué
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un communiqué…"
            className="pl-9"
            aria-label="Rechercher un communiqué"
          />
        </div>
        <select
          className="edu-select"
          aria-label="Filtrer par destinataires"
          value={filtreDest}
          onChange={(e) => setFiltreDest(e.target.value)}
        >
          <option value="">Tous les destinataires</option>
          {DESTINATAIRES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className="edu-select"
          aria-label="Filtrer par portée"
          value={filtreCycle}
          onChange={(e) => setFiltreCycle(e.target.value)}
        >
          <option value="">Toute la portée</option>
          <option value="ecole">Établissement</option>
          {(Object.keys(FAMILLES_CYCLE) as FamilleCycle[]).map((key) => (
            <option key={key} value={key}>
              {FAMILLES_CYCLE[key].label}
            </option>
          ))}
        </select>
        <select
          className="edu-select"
          aria-label="Filtrer par urgence"
          value={filtreUrgent}
          onChange={(e) => setFiltreUrgent(e.target.value)}
        >
          <option value="">Toutes les priorités</option>
          <option value="urgent">Urgents</option>
          <option value="normal">Non urgents</option>
        </select>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les communiqués.</p>
          <Button type="button" onClick={() => refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : items.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun communiqué pour l’établissement</p>
          <p className={`${portalMutedClass} mt-1`}>Publiez une note pour les parents ou les professeurs.</p>
          <Button type="button" className="mt-4" onClick={() => openCreate()}>
            Nouveau communiqué
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>Aucun communiqué ne correspond à la recherche.</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Portée</TableHead>
                <TableHead>Destinataires</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="max-w-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setReading(item)}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        {item.urgent ? (
                          <span className="inline-flex min-h-9 items-center rounded-full bg-destructive/10 px-3 text-sm font-semibold text-destructive">
                            Urgent
                          </span>
                        ) : null}
                        <span className={portalTitleClass}>{item.titre}</span>
                      </span>
                      <span className={`${portalMutedClass} mt-1 line-clamp-1 block`}>{item.corps}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className={portalChipClass}>{cycleLabel(item.familleCycle)}</span>
                  </TableCell>
                  <TableCell>
                    <span className={portalChipClass}>{destLabel(item.destinataires)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Recopier ${item.titre}`}
                        onClick={() =>
                          openCreate({
                            titre: item.titre,
                            corps: item.corps,
                            urgent: item.urgent,
                            destinataires: item.destinataires,
                          })
                        }
                      >
                        <Copy />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Retirer ${item.titre}`}
                        onClick={() => setToDelete(item)}
                      >
                        <Trash2 />
                      </Button>
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
          if (!open) setForm(EMPTY_FORM);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau communiqué</DialogTitle>
            <DialogDescription>
              {destPublishHint(form.destinataires)} Toute l’école, tous cycles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Titre">
              <Input
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Réunion de rentrée"
                maxLength={120}
              />
            </Field>
            <Field label="Message">
              <Textarea
                rows={6}
                value={form.corps}
                onChange={(e) => setForm({ ...form, corps: e.target.value })}
                placeholder="Précisez la date, le lieu et ce qui est attendu."
                maxLength={4000}
              />
            </Field>
            <Field label="Destinataires">
              <select
                className="edu-select w-full"
                value={form.destinataires}
                onChange={(e) => setForm({ ...form, destinataires: e.target.value as Destinataire })}
              >
                {DESTINATAIRES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
              <Switch
                checked={form.urgent}
                onCheckedChange={(checked) => setForm({ ...form, urgent: checked })}
              />
              Marquer comme urgent
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => setConfirmPublish(true)} disabled={!canPublish || busy}>
              Publier
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
                  {formatWhen(reading.createdAt)} · Par {reading.auteur}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                {reading.urgent ? (
                  <span className="inline-flex min-h-9 items-center rounded-full bg-destructive/10 px-3 text-sm font-semibold text-destructive">
                    Urgent
                  </span>
                ) : null}
                <span className={portalChipClass}>{cycleLabel(reading.familleCycle)}</span>
                <span className={portalChipClass}>{destLabel(reading.destinataires)}</span>
              </div>
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
                      openCreate({
                        titre: reading.titre,
                        corps: reading.corps,
                        urgent: reading.urgent,
                        destinataires: reading.destinataires,
                      });
                      setReading(null);
                    }}
                  >
                    Recopier
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title="Publier ce communiqué ?"
        description={`${destPublishHint(form.destinataires)} Cette action envoie les notifications tout de suite.`}
        confirmText="Publier le communiqué"
        cancelText="Annuler"
        isLoading={busy}
        onConfirm={publish}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={toDelete ? `Retirer « ${toDelete.titre} » ?` : "Retirer le communiqué ?"}
        description="Il disparaît de l’historique de l’établissement. Les notifications liées sont aussi retirées."
        confirmText="Retirer le communiqué"
        cancelText="Annuler"
        variant="destructive"
        isLoading={busy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
