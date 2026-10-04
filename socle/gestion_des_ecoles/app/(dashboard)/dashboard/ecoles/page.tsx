"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FAMILLES_CYCLE } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Ecole = {
  id: string;
  nom: string;
  nomOfficiel: string | null;
  sigle: string | null;
  ville: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  montantMensuel: number | null;
  montantAnnuel: number | null;
  cycles: string[];
  eleves: number;
  classes: number;
  directeurs: number;
  prefets: number;
  professeurs: number;
};

const PAGE_SIZE = 30;
const EMPTY_FORM = {
  nom: "",
  nomOfficiel: "",
  sigle: "",
  ville: "",
  adresse: "",
  telephone: "",
  email: "",
  montantMensuel: "",
  montantAnnuel: "",
  cycles: ["PRIMAIRE", "COLLEGE", "SECONDAIRE"] as string[],
  prefetEmails: { PRIMAIRE: "", COLLEGE: "", SECONDAIRE: "" } as Record<string, string>,
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function AdminEcolesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <AdminEcolesForm />
    </Suspense>
  );
}

function AdminEcolesForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filtreActif, setFiltreActif] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ecole | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toToggle, setToToggle] = useState<Ecole | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/ecoles");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setEcoles(body.data ?? []);
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les établissements" });
    }
  };

  useEffect(() => {
    refresh().then(() => {
      if (searchParams.get("creer") === "1") setFormOpen(true);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ecoles.filter((ecole) => {
      if (filtreActif === "actif" && !ecole.actif) return false;
      if (filtreActif === "inactif" && ecole.actif) return false;
      if (!q) return true;
      return `${ecole.nom} ${ecole.ville}`.toLowerCase().includes(q);
    });
  }, [ecoles, search, filtreActif]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreActif]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (ecole: Ecole) => {
    setEditing(ecole);
    setForm({
      ...EMPTY_FORM,
      nom: ecole.nom,
      nomOfficiel: ecole.nomOfficiel ?? "",
      sigle: ecole.sigle ?? "",
      ville: ecole.ville,
      adresse: ecole.adresse ?? "",
      telephone: ecole.telephone ?? "",
      email: ecole.email ?? "",
      montantMensuel: ecole.montantMensuel != null ? String(ecole.montantMensuel) : "",
      montantAnnuel: ecole.montantAnnuel != null ? String(ecole.montantAnnuel) : "",
      cycles: ecole.cycles.length ? ecole.cycles : ["PRIMAIRE", "COLLEGE", "SECONDAIRE"],
    });
    setFormOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const url = editing ? `/api/admin/ecoles/${editing.id}` : "/api/admin/ecoles";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          nomOfficiel: form.nomOfficiel || form.nom,
          sigle: form.sigle || null,
          ville: form.ville,
          adresse: form.adresse || null,
          telephone: form.telephone || null,
          email: form.email || null,
          montantMensuel: form.montantMensuel ? Number(form.montantMensuel) : null,
          montantAnnuel: form.montantAnnuel ? Number(form.montantAnnuel) : null,
          cycles: form.cycles,
          ...(editing
            ? {}
            : {
                prefets: form.cycles.flatMap((famille) => {
                  const email = form.prefetEmails[famille]?.trim();
                  if (!email) return [];
                  const label = FAMILLES_CYCLE[famille as keyof typeof FAMILLES_CYCLE]?.label ?? famille;
                  return [{ famille, prenom: "Préfet", nom: label, email }];
                }),
              }),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: editing ? "Établissement mis à jour" : `${body.data.nom} créé`,
        description: editing
          ? undefined
          : body.data.prefets?.length
            ? `${body.data.prefets.length} compte${body.data.prefets.length > 1 ? "s" : ""} préfet créé${body.data.prefets.length > 1 ? "s" : ""} — mot de passe envoyé par e-mail.`
            : "Créez ensuite le directeur et les préfets dans Comptes.",
      });
      setFormOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: editing ? "Modification refusée" : "Création refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmToggle = async () => {
    if (!toToggle) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ecoles/${toToggle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !toToggle.actif }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: toToggle.actif ? "Établissement désactivé" : "Établissement réactivé",
        description: toToggle.actif
          ? "Il n’accepte plus de nouvelles connexions staff."
          : "Les comptes de l’établissement peuvent à nouveau se connecter.",
      });
      setToToggle(null);
      await load();
      setStatus("ready");
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

  const canSave = form.nom.trim().length >= 2 && form.ville.trim().length >= 2 && form.cycles.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Établissements</h1>
          <p className={`${portalMutedClass} mt-1`}>
            Un établissement inactif n’accepte plus de nouvelles connexions staff
            {status === "ready" ? ` · ${ecoles.length}` : ""}.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouvel établissement
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un établissement…"
            className="pl-9"
            aria-label="Rechercher un établissement"
          />
        </div>
        <select
          className="edu-select"
          aria-label="Filtrer par statut"
          value={filtreActif}
          onChange={(e) => setFiltreActif(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les établissements.</p>
          <Button type="button" onClick={() => refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : ecoles.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun établissement</p>
          <p className={`${portalMutedClass} mt-1`}>Créez le premier pour rattacher des comptes.</p>
          <Button type="button" className="mt-4" onClick={openCreate}>
            Nouvel établissement
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>Aucun établissement ne correspond à la recherche.</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead className="text-right">Classes</TableHead>
                <TableHead className="text-right">Élèves</TableHead>
                <TableHead>Personnel</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-48 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((ecole) => (
                <TableRow key={ecole.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/ecoles/${ecole.id}`} className="hover:text-primary">
                      {ecole.nom}
                    </Link>
                  </TableCell>
                  <TableCell>{ecole.ville}</TableCell>
                  <TableCell className="text-right tabular-nums">{ecole.classes}</TableCell>
                  <TableCell className="text-right tabular-nums">{ecole.eleves}</TableCell>
                  <TableCell className={portalMutedClass}>
                    {ecole.directeurs} dir. · {ecole.prefets} préf. · {ecole.professeurs} prof.
                  </TableCell>
                  <TableCell>
                    <span className={portalChipClass}>{ecole.actif ? "Actif" : "Inactif"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/ecoles/${ecole.id}`} aria-label={`Fiche ${ecole.nom}`}>
                          <Eye />
                        </Link>
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Modifier ${ecole.nom}`} onClick={() => openEdit(ecole)}>
                        <Pencil />
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setToToggle(ecole)}>
                        {ecole.actif ? "Désactiver" : "Réactiver"}
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
          </div>
        </>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l’établissement" : "Nouvel établissement"}</DialogTitle>
            <DialogDescription>
              Nom officiel, contacts, licence NOVA et cycles ouverts. Les préfets ne pourront être créés que sur ces cycles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="NOVA Rufisque"
                maxLength={120}
              />
            </Field>
            <Field label="Nom officiel">
              <Input
                value={form.nomOfficiel}
                onChange={(e) => setForm({ ...form, nomOfficiel: e.target.value })}
                placeholder="Groupe scolaire NOVA Rufisque"
              />
            </Field>
            <Field label="Sigle">
              <Input value={form.sigle} onChange={(e) => setForm({ ...form, sigle: e.target.value })} placeholder="GSNR" />
            </Field>
            <Field label="Ville">
              <Input
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                placeholder="Rufisque"
                maxLength={80}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Adresse">
                <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
              </Field>
            </div>
            <Field label="Téléphone">
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Licence mensuelle (FCFA)">
              <Input
                type="number"
                min={0}
                value={form.montantMensuel}
                onChange={(e) => setForm({ ...form, montantMensuel: e.target.value })}
              />
            </Field>
            <Field label="Licence annuelle (FCFA)">
              <Input
                type="number"
                min={0}
                value={form.montantAnnuel}
                onChange={(e) => setForm({ ...form, montantAnnuel: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Cycles</p>
              <div className="flex flex-wrap gap-4">
                {(Object.keys(FAMILLES_CYCLE) as Array<keyof typeof FAMILLES_CYCLE>).map((key) => (
                  <label key={key} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.cycles.includes(key)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          cycles: current.cycles.includes(key)
                            ? current.cycles.filter((item) => item !== key)
                            : [...current.cycles, key],
                        }))
                      }
                    />
                    {FAMILLES_CYCLE[key].label}
                  </label>
                ))}
              </div>
            </div>
            {!editing ? (
              <div className="sm:col-span-2 space-y-3">
                <p className="text-sm font-medium">Comptes préfets (optionnel)</p>
                <p className="text-xs text-muted-foreground">
                  Un e-mail par cycle ouvert crée le compte et envoie le mot de passe. Sinon, créez-les dans Comptes.
                </p>
                {form.cycles.map((famille) => (
                  <Field key={famille} label={`Préfet ${FAMILLES_CYCLE[famille as keyof typeof FAMILLES_CYCLE]?.label ?? famille}`}>
                    <Input
                      type="email"
                      value={form.prefetEmails[famille] ?? ""}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          prefetEmails: { ...current.prefetEmails, [famille]: e.target.value },
                        }))
                      }
                      placeholder="prefet.cycle@ecole.sn"
                    />
                  </Field>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {!editing ? (
              <Button asChild variant="ghost">
                <Link href="/dashboard/comptes?creer=1">Aller aux comptes</Link>
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={save} disabled={!canSave || busy}>
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toToggle}
        onOpenChange={(open) => {
          if (!open) setToToggle(null);
        }}
        title={
          toToggle?.actif
            ? `Désactiver « ${toToggle.nom} » ?`
            : toToggle
              ? `Réactiver « ${toToggle.nom} » ?`
              : "Modifier le statut ?"
        }
        description={
          toToggle?.actif
            ? "Les comptes staff de cet établissement ne pourront plus se connecter. Les données restent en base."
            : "Les comptes de l’établissement pourront à nouveau se connecter."
        }
        confirmText={toToggle?.actif ? "Désactiver" : "Réactiver"}
        cancelText="Annuler"
        variant={toToggle?.actif ? "destructive" : "default"}
        isLoading={busy}
        onConfirm={confirmToggle}
      />
    </div>
  );
}
