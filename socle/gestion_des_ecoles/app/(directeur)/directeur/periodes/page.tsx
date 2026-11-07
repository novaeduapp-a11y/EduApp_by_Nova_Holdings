"use client";

import { useEffect, useState } from "react";
import { CalendarRange, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Periode = {
  id: string;
  nom: string;
  numero: number;
  dateDebut: string;
  dateFin: string;
  anneeScolaire: string;
  actif: boolean;
};

type PeriodeForm = {
  nom: string;
  numero: string;
  dateDebut: string;
  dateFin: string;
  anneeScolaire: string;
};

const emptyForm = (): PeriodeForm => ({
  nom: "",
  numero: "1",
  dateDebut: "",
  dateFin: "",
  anneeScolaire: "",
});

export default function DirecteurPeriodesPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Periode | null>(null);
  const [form, setForm] = useState<PeriodeForm>(emptyForm);

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/direction/periodes");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Chargement impossible");
      setPeriodes(body.data ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (periode: Periode) => {
    setEditing(periode);
    setForm({
      nom: periode.nom,
      numero: String(periode.numero),
      dateDebut: periode.dateDebut,
      dateFin: periode.dateFin,
      anneeScolaire: periode.anneeScolaire,
    });
    setDialogOpen(true);
  };

  const setPeriode = async (periode: Periode, actif: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/direction/periodes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: periode.id, actif }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Mise à jour refusée");
      toast({
        title: actif ? "Période activée" : "Période désactivée",
        description: actif
          ? `${periode.nom} est maintenant la période active de l’école.`
          : `${periode.nom} n’est plus active pour l’école.`,
      });
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Période refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const saveForm = async () => {
    const numero = Number(form.numero);
    if (!form.nom.trim() || !form.anneeScolaire.trim() || !form.dateDebut || !form.dateFin) {
      toast({ variant: "destructive", title: "Complétez tous les champs" });
      return;
    }
    if (!Number.isFinite(numero) || numero < 1) {
      toast({ variant: "destructive", title: "Numéro de période invalide" });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        numero,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        anneeScolaire: form.anneeScolaire.trim(),
      };
      const res = await fetch("/api/staff/direction/periodes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Enregistrement refusé");
      toast({ title: editing ? "Période modifiée" : "Période créée" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm());
      await load();
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

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={portalPanelClass}>
        <p className={portalMutedClass}>Impossible de charger les périodes.</p>
        <Button className="mt-3" variant="outline" onClick={() => void load()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" aria-hidden />
          <h1 className={portalTitleClass}>Périodes</h1>
        </div>
        <p className={portalMutedClass}>
          Une seule période académique peut être active simultanément. La saisie des
          évaluations, l&apos;édition des bulletins et l&apos;affichage sur l&apos;application
          familiale dépendent de ce paramètre.
        </p>
      </header>

      <section className={portalPanelClass} aria-labelledby="liste-periodes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="liste-periodes" className={portalTitleClass}>
            Trimestres / semestres
          </h2>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Nouvelle période
          </Button>
        </div>
        {periodes.length === 0 ? (
          <p className={`mt-4 ${portalMutedClass}`}>
            Aucune période en base. Ajoutez un trimestre ou un semestre pour démarrer.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {periodes.map((periode) => (
              <li
                key={periode.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{periode.nom}</p>
                  <p className={portalMutedClass}>
                    Année scolaire {periode.anneeScolaire}
                  </p>
                  <p className={portalMutedClass}>
                    Du {new Date(`${periode.dateDebut}T12:00:00`).toLocaleDateString("fr-FR")} au{" "}
                    {new Date(`${periode.dateFin}T12:00:00`).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(periode)}
                    disabled={busy}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Modifier
                  </Button>
                  <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
                    <Switch
                      checked={periode.actif}
                      disabled={busy}
                      onCheckedChange={(checked) => void setPeriode(periode, checked)}
                    />
                    {periode.actif ? "Active" : "Inactive"}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la période" : "Nouvelle période"}</DialogTitle>
            <DialogDescription>
              Définissez le nom, l’année scolaire et les dates du trimestre ou semestre.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="periode-nom">Nom</Label>
              <Input
                id="periode-nom"
                value={form.nom}
                placeholder="1er trimestre"
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="periode-numero">Numéro</Label>
                <Input
                  id="periode-numero"
                  type="number"
                  min={1}
                  max={12}
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="periode-annee">Année scolaire</Label>
                <Input
                  id="periode-annee"
                  value={form.anneeScolaire}
                  placeholder="2025-2026"
                  onChange={(e) => setForm({ ...form, anneeScolaire: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="periode-debut">Date de début</Label>
                <Input
                  id="periode-debut"
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="periode-fin">Date de fin</Label>
                <Input
                  id="periode-fin"
                  type="date"
                  value={form.dateFin}
                  onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void saveForm()} disabled={busy}>
              {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
