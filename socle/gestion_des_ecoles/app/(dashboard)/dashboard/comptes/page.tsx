"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, KeyRound, Pencil, Plus, Search } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { FAMILLES_CYCLE } from "@/lib/constants";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Role = "ADMIN" | "DIRECTEUR" | "PREFET" | "PROFESSEUR";
type FamilleCycle = keyof typeof FAMILLES_CYCLE;
type TypeProf = "PRIMAIRE" | "MATIERE";

type Ecole = { id: string; nom: string; ville: string; actif: boolean };

type Compte = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  actif: boolean;
  ecoleId: string | null;
  familleCycle: FamilleCycle | null;
  typeProfesseur: TypeProf | null;
  ecole: { id: string; nom: string; ville: string } | null;
  matiereIds?: string[];
};

const PAGE_SIZE = 30;

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin NOVA",
  DIRECTEUR: "Directeur",
  PREFET: "Préfet",
  PROFESSEUR: "Professeur",
};

const EMPTY_FORM = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  role: "DIRECTEUR" as Role,
  ecoleId: "",
  familleCycle: "PRIMAIRE" as FamilleCycle,
  typeProfesseur: "PRIMAIRE" as TypeProf,
  password: "",
  matiereIds: [] as string[],
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function detail(compte: Compte) {
  if (compte.role === "PREFET" && compte.familleCycle) return FAMILLES_CYCLE[compte.familleCycle].label;
  if (compte.role === "PROFESSEUR") return compte.typeProfesseur === "PRIMAIRE" ? "Instituteur" : "Matière";
  return "";
}

export default function AdminComptesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <AdminComptesForm />
    </Suspense>
  );
}

function AdminComptesForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [matieres, setMatieres] = useState<{ id: string; nom: string }[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filtreRole, setFiltreRole] = useState(searchParams.get("role") ?? "");
  const [filtreEcole, setFiltreEcole] = useState(searchParams.get("ecoleId") ?? "");
  const [filtreActif, setFiltreActif] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Compte | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toToggle, setToToggle] = useState<Compte | null>(null);
  const [toReset, setToReset] = useState<Compte | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string; emailed?: boolean } | null>(null);

  const load = async () => {
    const [e, c] = await Promise.all([
      fetch("/api/admin/ecoles").then((res) => res.json()),
      fetch("/api/admin/comptes").then((res) => res.json()),
    ]);
    if (!Array.isArray(e.data) && e.error) throw new Error(e.error);
    if (!Array.isArray(c.data) && c.error) throw new Error(c.error);
    const list = (e.data ?? []) as Ecole[];
    setEcoles(list);
    setComptes(c.data ?? []);
    setMatieres(c.matieres ?? []);
    setForm((prev) => ({
      ...prev,
      ecoleId: prev.ecoleId || list.find((item) => item.actif)?.id || "",
    }));
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les comptes" });
    }
  };

  useEffect(() => {
    refresh().then(() => {
      if (searchParams.get("creer") === "1") setFormOpen(true);
    });
  }, []);

  const ecolesActives = useMemo(() => ecoles.filter((item) => item.actif), [ecoles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return comptes.filter((compte) => {
      if (filtreRole && compte.role !== filtreRole) return false;
      if (filtreEcole && compte.ecoleId !== filtreEcole) return false;
      if (filtreActif === "actif" && !compte.actif) return false;
      if (filtreActif === "inactif" && compte.actif) return false;
      if (!q) return true;
      return `${compte.prenom} ${compte.nom} ${compte.email} ${compte.ecole?.nom ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [comptes, search, filtreRole, filtreEcole, filtreActif]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreRole, filtreEcole, filtreActif]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      ecoleId: searchParams.get("ecoleId") || ecolesActives[0]?.id || "",
      role: (searchParams.get("role") as Role) || "DIRECTEUR",
    });
    setFormOpen(true);
  };

  const openEdit = (compte: Compte) => {
    setEditing(compte);
    setForm({
      prenom: compte.prenom,
      nom: compte.nom,
      email: compte.email,
      telephone: compte.telephone ?? "",
      role: compte.role,
      ecoleId: compte.ecoleId ?? "",
      familleCycle: compte.familleCycle ?? "PRIMAIRE",
      typeProfesseur: compte.typeProfesseur ?? "PRIMAIRE",
      password: "",
      matiereIds: compte.matiereIds ?? [],
    });
    setFormOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/comptes/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prenom: form.prenom,
            nom: form.nom,
            telephone: form.telephone || null,
            ecoleId: form.role === "ADMIN" ? null : form.ecoleId,
            familleCycle: form.role === "PREFET" ? form.familleCycle : null,
            typeProfesseur: form.role === "PROFESSEUR" ? form.typeProfesseur : null,
            matiereIds: form.role === "PROFESSEUR" && form.typeProfesseur === "MATIERE" ? form.matiereIds : [],
            password: form.password || undefined,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        toast({ title: "Compte mis à jour" });
      } else {
        const res = await fetch("/api/admin/comptes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prenom: form.prenom,
            nom: form.nom,
            email: form.email,
            telephone: form.telephone || undefined,
            role: form.role,
            ecoleId: form.role === "ADMIN" ? null : form.ecoleId,
            familleCycle: form.role === "PREFET" ? form.familleCycle : null,
            typeProfesseur: form.role === "PROFESSEUR" ? form.typeProfesseur : null,
            matiereIds: form.role === "PROFESSEUR" && form.typeProfesseur === "MATIERE" ? form.matiereIds : [],
            password: form.password || undefined,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setSecret({
          email: body.data.email,
          password: body.data.motDePasseTemporaire,
          emailed: Boolean(body.data.emailed),
        });
      }
      setFormOpen(false);
      setEditing(null);
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
      const res = await fetch(`/api/admin/comptes/${toToggle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !toToggle.actif }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: toToggle.actif ? "Compte désactivé" : "Compte réactivé" });
      setToToggle(null);
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async () => {
    if (!toReset) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/comptes/${toReset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setToReset(null);
      setSecret({
        email: toReset.email,
        password: body.data.motDePasseTemporaire,
        emailed: Boolean(body.data.emailed),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Réinitialisation refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const canSave =
    form.prenom.trim().length >= 2 &&
    form.nom.trim().length >= 2 &&
    (editing || form.email.trim().includes("@")) &&
    (form.role === "ADMIN" || Boolean(form.ecoleId)) &&
    (form.role !== "PROFESSEUR" || form.typeProfesseur !== "MATIERE" || form.matiereIds.length >= 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Comptes</h1>
          <p className={`${portalMutedClass} mt-1`}>
            Direction, préfets et professeurs rattachés à un établissement. Les parents se créent à l’inscription
            {status === "ready" ? ` · ${comptes.length}` : ""}.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouveau compte
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom ou un e-mail…"
            className="pl-9"
            aria-label="Rechercher un compte"
          />
        </div>
        <select className="edu-select" aria-label="Filtrer par rôle" value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          <option value="DIRECTEUR">Directeurs</option>
          <option value="PREFET">Préfets</option>
          <option value="PROFESSEUR">Professeurs</option>
          <option value="ADMIN">Admins NOVA</option>
        </select>
        <select className="edu-select" aria-label="Filtrer par établissement" value={filtreEcole} onChange={(e) => setFiltreEcole(e.target.value)}>
          <option value="">Tous les établissements</option>
          {ecoles.map((ecole) => (
            <option key={ecole.id} value={ecole.id}>
              {ecole.nom}
            </option>
          ))}
        </select>
        <select className="edu-select" aria-label="Filtrer par statut" value={filtreActif} onChange={(e) => setFiltreActif(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les comptes.</p>
          <Button type="button" onClick={() => refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : comptes.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun compte staff</p>
          <p className={`${portalMutedClass} mt-1`}>Créez un directeur après l’établissement.</p>
          <Button type="button" className="mt-4" onClick={openCreate}>
            Nouveau compte
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>Aucun compte ne correspond à la recherche.</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-52 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((compte) => (
                <TableRow key={compte.id}>
                  <TableCell className="font-medium">
                    {compte.prenom} {compte.nom}
                  </TableCell>
                  <TableCell>{compte.email}</TableCell>
                  <TableCell>
                    {ROLE_LABEL[compte.role]}
                    {detail(compte) ? ` · ${detail(compte)}` : ""}
                  </TableCell>
                  <TableCell>{compte.ecole ? `${compte.ecole.nom}` : "—"}</TableCell>
                  <TableCell>
                    <span className={portalChipClass}>{compte.actif ? "Actif" : "Inactif"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon" aria-label={`Modifier ${compte.prenom}`} onClick={() => openEdit(compte)}>
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Réinitialiser le mot de passe de ${compte.prenom}`}
                        onClick={() => setToReset(compte)}
                      >
                        <KeyRound />
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setToToggle(compte)}>
                        {compte.actif ? "Désactiver" : "Réactiver"}
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
              <Button type="button" variant="outline" disabled={pageSafe <= 1} onClick={() => setPage((c) => Math.max(1, c - 1))}>
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
                onClick={() => setPage((c) => Math.min(pageCount, c + 1))}
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
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le compte" : "Nouveau compte"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "L’e-mail et le rôle ne se changent pas ici."
                : "Un mot de passe temporaire est envoyé par e-mail et affiché une seule fois ici."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom">
              <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </Field>
            <Field label="Nom">
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Téléphone">
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </Field>
            <Field label="Rôle">
              <select
                className="edu-select w-full"
                value={form.role}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="DIRECTEUR">Directeur</option>
                <option value="PREFET">Préfet</option>
                <option value="PROFESSEUR">Professeur</option>
                <option value="ADMIN">Admin NOVA</option>
              </select>
            </Field>
            {form.role !== "ADMIN" ? (
              <Field label="Établissement">
                <select
                  className="edu-select w-full"
                  value={form.ecoleId}
                  onChange={(e) => setForm({ ...form, ecoleId: e.target.value })}
                >
                  {ecolesActives.map((ecole) => (
                    <option key={ecole.id} value={ecole.id}>
                      {ecole.nom} · {ecole.ville}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {form.role === "PREFET" ? (
              <Field label="Cycle">
                <select
                  className="edu-select w-full"
                  value={form.familleCycle}
                  onChange={(e) => setForm({ ...form, familleCycle: e.target.value as FamilleCycle })}
                >
                  {(Object.keys(FAMILLES_CYCLE) as FamilleCycle[]).map((key) => (
                    <option key={key} value={key}>
                      {FAMILLES_CYCLE[key].label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {form.role === "PROFESSEUR" ? (
              <Field label="Type">
                <select
                  className="edu-select w-full"
                  value={form.typeProfesseur}
                  onChange={(e) => setForm({ ...form, typeProfesseur: e.target.value as TypeProf, matiereIds: [] })}
                >
                  <option value="PRIMAIRE">Instituteur</option>
                  <option value="MATIERE">Professeur de matière</option>
                </select>
              </Field>
            ) : null}
            {form.role === "PROFESSEUR" && form.typeProfesseur === "MATIERE" ? (
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium">Matières enseignées</p>
                <p className="mb-2 text-xs text-muted-foreground">Une par défaut. Cochez une seconde seulement si le prof l’enseigne vraiment.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {matieres.map((matiere) => (
                    <label key={matiere.id} className="flex min-h-10 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.matiereIds.includes(matiere.id)}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            matiereIds: current.matiereIds.includes(matiere.id)
                              ? current.matiereIds.filter((id) => id !== matiere.id)
                              : [...current.matiereIds, matiere.id],
                          }))
                        }
                      />
                      {matiere.nom}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            {!editing ? (
              <div className="sm:col-span-2">
                <Field label="Mot de passe (optionnel)">
                  <Input
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Laissé vide = mot de passe temporaire"
                  />
                </Field>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={save} disabled={!canSave || busy}>
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!secret} onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mot de passe temporaire</DialogTitle>
            <DialogDescription>
              {secret?.emailed
                ? "Un e-mail EduApps a aussi été envoyé à la personne. Vous pouvez quand même noter le mot de passe ici."
                : "Notez-le maintenant : il ne sera plus affiché. L’e-mail n’a pas pu être envoyé."}
            </DialogDescription>
          </DialogHeader>
          {secret ? (
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="font-medium">{secret.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mot de passe</dt>
                <dd className="font-mono font-medium">{secret.password}</dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (secret) void navigator.clipboard.writeText(`${secret.email}\n${secret.password}`);
                toast({ title: "Copié" });
              }}
            >
              Copier
            </Button>
            <Button type="button" onClick={() => setSecret(null)}>
              J’ai noté
            </Button>
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
            ? `Désactiver ${toToggle.prenom} ${toToggle.nom} ?`
            : toToggle
              ? `Réactiver ${toToggle.prenom} ${toToggle.nom} ?`
              : "Modifier le compte ?"
        }
        description={
          toToggle?.actif
            ? "Cette personne ne pourra plus se connecter."
            : "Cette personne pourra de nouveau se connecter."
        }
        confirmText={toToggle?.actif ? "Désactiver" : "Réactiver"}
        cancelText="Annuler"
        variant={toToggle?.actif ? "destructive" : "default"}
        isLoading={busy}
        onConfirm={confirmToggle}
      />

      <ConfirmDialog
        open={!!toReset}
        onOpenChange={(open) => {
          if (!open) setToReset(null);
        }}
        title={toReset ? `Nouveau mot de passe pour ${toReset.prenom} ${toReset.nom} ?` : "Réinitialiser ?"}
        description="L’ancien mot de passe ne fonctionnera plus. Le nouveau est envoyé par e-mail et affiché une seule fois."
        confirmText="Réinitialiser"
        cancelText="Annuler"
        variant="destructive"
        isLoading={busy}
        onConfirm={confirmReset}
      />
    </div>
  );
}
