"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type Classe = { id: string; nom: string; niveau: string; effectif?: number; effectifMax?: number };
type Eleve = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string | null;
  adresse: string | null;
  nomTuteur: string | null;
  telephoneTuteur: string | null;
  emailParent: string | null;
  groupeSanguin: string | null;
  allergies: string | null;
  telephoneSecours: string | null;
  lienTuteur: string | null;
  classe: { id: string; nom: string; niveau: string };
};

type FormState = {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: string;
  niveau: string;
  classeId: string;
  nomTuteur: string;
  telephoneTuteur: string;
  emailParent: string;
  adresse: string;
  groupeSanguin: string;
  allergies: string;
  telephoneSecours: string;
  lienTuteur: string;
};

const emptyForm: FormState = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  sexe: "M",
  niveau: "",
  classeId: "",
  nomTuteur: "",
  telephoneTuteur: "",
  emailParent: "",
  adresse: "",
  groupeSanguin: "",
  allergies: "",
  telephoneSecours: "",
  lienTuteur: "tuteur",
};

const PAGE_SIZE = 30;

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function PrefetElevesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <PrefetElevesForm />
    </Suspense>
  );
}

function PrefetElevesForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const classeFromUrl = searchParams.get("classeId") ?? "";
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Eleve | null>(null);
  const [toDelete, setToDelete] = useState<Eleve | null>(null);
  const [busy, setBusy] = useState(false);
  const [filtreClasse, setFiltreClasse] = useState(classeFromUrl);
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [search, setSearch] = useState("");
  const [filtreSexe, setFiltreSexe] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = async () => {
    const [e, c] = await Promise.all([
      fetch("/api/staff/prefet/eleves"),
      fetch("/api/staff/prefet/classes"),
    ]);
    const elevesBody = await e.json();
    const classesBody = await c.json();
    if (!e.ok) throw new Error(elevesBody.error);
    if (!c.ok) throw new Error(classesBody.error);
    setEleves(elevesBody.data ?? []);
    const list = (classesBody.data?.classes ?? []) as Classe[];
    setClasses(list);
    return list;
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger les élèves" });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const niveaux = useMemo(() => uniqueNiveaux(classes), [classes]);
  const classesDuNiveau = useMemo(
    () => (form.niveau ? classes.filter((c) => c.niveau === form.niveau) : classes),
    [classes, form.niveau]
  );
  const elevesFiltres = useMemo(() => {
    return eleves.filter((eleve) => {
      if (filtreNiveau && eleve.classe.niveau !== filtreNiveau) return false;
      if (filtreClasse && eleve.classe.id !== filtreClasse) return false;
      if (filtreSexe && eleve.sexe !== filtreSexe) return false;
      return matchesEleveSearch(eleve, search);
    });
  }, [eleves, filtreNiveau, filtreClasse, filtreSexe, search]);

  const pageCount = Math.max(1, Math.ceil(elevesFiltres.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const elevesPage = elevesFiltres.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = elevesFiltres.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, elevesFiltres.length);

  useEffect(() => {
    setPage(1);
  }, [search, filtreNiveau, filtreClasse, filtreSexe]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const patchForm = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    const niveau = filtreNiveau || classes[0]?.niveau || "";
    const classeId =
      filtreClasse ||
      classes.find((item) => item.niveau === niveau)?.id ||
      classes[0]?.id ||
      "";
    setEditing(null);
    setForm({
      ...emptyForm,
      niveau,
      classeId,
    });
    setFormOpen(true);
  };

  const openEdit = (eleve: Eleve) => {
    setEditing(eleve);
    setForm({
      nom: eleve.nom,
      prenom: eleve.prenom,
      dateNaissance: eleve.dateNaissance.slice(0, 10),
      lieuNaissance: eleve.lieuNaissance ?? "",
      sexe: eleve.sexe,
      niveau: eleve.classe.niveau,
      classeId: eleve.classe.id,
      nomTuteur: eleve.nomTuteur ?? "",
      telephoneTuteur: eleve.telephoneTuteur ?? "",
      emailParent: eleve.emailParent ?? "",
      adresse: eleve.adresse ?? "",
      groupeSanguin: eleve.groupeSanguin ?? "",
      allergies: eleve.allergies ?? "",
      telephoneSecours: eleve.telephoneSecours ?? "",
      lienTuteur: eleve.lienTuteur || "tuteur",
    });
    setFormOpen(true);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        editing ? `/api/staff/prefet/eleves/${editing.id}` : "/api/staff/prefet/eleves",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      if (editing) {
        toast({ title: `Fiche mise à jour · ${body.data.matricule}` });
      } else {
        const parent = body.data.parent;
        toast({
          title: `Inscrit · ${body.data.matricule}`,
          description: parent?.cree
            ? `Compte parent créé (${parent.email}). Mot de passe temporaire : ${parent.motDePasseTemporaire}`
            : `Parent déjà lié : ${parent?.email}. Visible dans EduParent.`,
        });
      }
      setFormOpen(false);
      setEditing(null);
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: editing ? "Modification refusée" : "Inscription refusée",
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
      const res = await fetch(`/api/staff/prefet/eleves/${toDelete.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: `${toDelete.prenom} ${toDelete.nom} a été retiré du cycle.` });
      setToDelete(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Élèves</h1>
          <p className={`${portalMutedClass} mt-1`}>
            {status === "ready"
              ? `${eleves.length} inscription${eleves.length > 1 ? "s" : ""} dans votre cycle.`
              : "Inscriptions isolées au cycle du préfet connecté."}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouvelle inscription
        </Button>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        niveaux={niveaux}
        niveau={filtreNiveau}
        onNiveauChange={setFiltreNiveau}
        classes={classes}
        classeId={filtreClasse}
        onClasseChange={setFiltreClasse}
        sexe={filtreSexe}
        onSexeChange={setFiltreSexe}
        extra={
          <Link
            href="/prefet/classes"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Gérer les classes
          </Link>
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger la liste.</p>
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
            {eleves.length === 0
              ? "Aucun élève dans ce cycle. Lancez une inscription."
              : "Aucun élève ne correspond à la recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Élève</TableHead>
              <TableHead className="px-4">Classe</TableHead>
              <TableHead className="hidden px-4 md:table-cell">Tuteur</TableHead>
              <TableHead className="px-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {elevesPage.map((eleve) => (
              <TableRow key={eleve.id} className="cursor-pointer" onClick={() => (window.location.href = `/prefet/eleves/${eleve.id}`)}>
                <TableCell className="px-4 py-3.5">
                  <Link href={`/prefet/eleves/${eleve.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-secondary text-sm font-semibold text-primary">
                        {initials(eleve.prenom, eleve.nom)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {eleve.prenom} {eleve.nom}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{eleve.matricule}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className={portalChipClass}>{eleve.classe.nom}</span>
                </TableCell>
                <TableCell className="hidden px-4 py-3.5 md:table-cell">
                  {eleve.nomTuteur ? (
                    <div>
                      <p className="text-foreground">{eleve.nomTuteur}</p>
                      <p className="text-xs text-muted-foreground">
                        {eleve.telephoneTuteur ?? eleve.emailParent ?? "—"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">À renseigner</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifier ${eleve.prenom} ${eleve.nom}`}
                      onClick={() => openEdit(eleve)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Supprimer ${eleve.prenom} ${eleve.nom}`}
                      onClick={() => setToDelete(eleve)}
                    >
                      <Trash2 />
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        href={`/prefet/bulletins?eleveId=${eleve.id}`}
                        aria-label={`Bulletin de ${eleve.prenom} ${eleve.nom}`}
                      >
                        <FileText />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la fiche" : "Nouvelle inscription"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Matricule ${editing.matricule}. Le changement d’e-mail relie un autre compte parent.`
                : "Niveau, puis classe. L’e-mail parent crée ou relie le compte EduParent."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom">
              <Input value={form.nom} onChange={(e) => patchForm({ nom: e.target.value })} />
            </Field>
            <Field label="Prénom">
              <Input value={form.prenom} onChange={(e) => patchForm({ prenom: e.target.value })} />
            </Field>
            <Field label="Date de naissance">
              <Input
                type="date"
                value={form.dateNaissance}
                onChange={(e) => patchForm({ dateNaissance: e.target.value })}
              />
            </Field>
            <Field label="Lieu de naissance">
              <Input value={form.lieuNaissance} onChange={(e) => patchForm({ lieuNaissance: e.target.value })} />
            </Field>
            <Field label="Sexe">
              <select
                className="edu-select w-full"
                value={form.sexe}
                onChange={(e) => patchForm({ sexe: e.target.value })}
              >
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </Field>
            <Field label="Niveau">
              <select
                className="edu-select w-full"
                value={form.niveau}
                onChange={(e) => {
                  const niveau = e.target.value;
                  const first = classes.find((c) => c.niveau === niveau);
                  patchForm({ niveau, classeId: first?.id ?? "" });
                }}
              >
                {niveaux.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {niveau}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Classe">
              <select
                className="edu-select w-full"
                value={form.classeId}
                onChange={(e) => patchForm({ classeId: e.target.value })}
              >
                {classesDuNiveau.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                    {classe.effectifMax != null ? ` (${classe.effectif ?? 0}/${classe.effectifMax})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Adresse">
              <Input value={form.adresse} onChange={(e) => patchForm({ adresse: e.target.value })} />
            </Field>
            <Field label="Groupe sanguin">
              <Input
                placeholder="O+"
                value={form.groupeSanguin}
                onChange={(e) => patchForm({ groupeSanguin: e.target.value })}
              />
            </Field>
            <Field label="Allergies">
              <Input value={form.allergies} onChange={(e) => patchForm({ allergies: e.target.value })} />
            </Field>
            <Field label="Tuteur">
              <Input value={form.nomTuteur} onChange={(e) => patchForm({ nomTuteur: e.target.value })} />
            </Field>
            <Field label="Lien avec l’élève">
              <select
                className="edu-select w-full"
                value={form.lienTuteur}
                onChange={(e) => patchForm({ lienTuteur: e.target.value })}
              >
                <option value="pere">Père</option>
                <option value="mere">Mère</option>
                <option value="tuteur">Tuteur</option>
              </select>
            </Field>
            <Field label="Téléphone tuteur">
              <Input value={form.telephoneTuteur} onChange={(e) => patchForm({ telephoneTuteur: e.target.value })} />
            </Field>
            <Field label="Téléphone de secours">
              <Input
                placeholder="Optionnel"
                value={form.telephoneSecours}
                onChange={(e) => patchForm({ telephoneSecours: e.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="E-mail parent (compte EduParent)">
                <Input
                  type="email"
                  placeholder="parent@ecole.sn"
                  value={form.emailParent}
                  onChange={(e) => patchForm({ emailParent: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submit} disabled={busy}>
              {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Inscrire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={toDelete ? `Retirer ${toDelete.prenom} ${toDelete.nom} ?` : "Retirer l’élève ?"}
        description="L’élève disparaît des listes du cycle. Les bulletins déjà générés restent archivés."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        isLoading={busy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
