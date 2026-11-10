"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EleveToolbar } from "@/components/shared/eleve-toolbar";
import { useToast } from "@/hooks/use-toast";
import {
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Affectation = {
  classeMatiereId: string;
  classeId: string;
  classe: string;
  niveau: string;
  professeurId: string | null;
  professeur: string | null;
  coefficient: number;
};

type MatiereGroup = {
  id: string;
  nom: string;
  code: string;
  coefficientDefaut: number;
  affectations: Affectation[];
};

export default function PrefetMatieresPage() {
  const { toast } = useToast();
  const [matieres, setMatieres] = useState<MatiereGroup[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newCoef, setNewCoef] = useState("1");

  const load = async () => {
    const res = await fetch("/api/staff/prefet/matieres");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Chargement impossible");
    setMatieres((body.data?.matieres ?? []) as MatiereGroup[]);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matieres;
    return matieres.filter(
      (m) =>
        m.nom.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.affectations.some(
          (a) =>
            a.classe.toLowerCase().includes(q) ||
            (a.professeur ?? "").toLowerCase().includes(q)
        )
    );
  }, [matieres, search]);

  const saveCoefDefaut = async (matiereId: string, coefficient: number) => {
    setBusyId(matiereId);
    try {
      const res = await fetch("/api/staff/prefet/matieres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matiereId, coefficient }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Enregistrement impossible");
      setMatieres((current) =>
        current.map((m) => (m.id === matiereId ? { ...m, coefficientDefaut: coefficient } : m))
      );
      toast({ title: "Coefficient enregistré" });
    } catch (error) {
      toast({
        title: "Coefficient refusé",
        description: error instanceof Error ? error.message : "Réessayez",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const createMatiere = async () => {
    const nom = newNom.trim();
    const coefficient = Number(newCoef);
    if (nom.length < 2) {
      toast({ variant: "destructive", title: "Indiquez un nom de matière" });
      return;
    }
    if (!Number.isFinite(coefficient) || coefficient < 0.25 || coefficient > 20) {
      toast({ variant: "destructive", title: "Coefficient entre 0,25 et 20" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/staff/prefet/matieres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, coefficient }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Création impossible");
      toast({
        title: "Matière créée",
        description: "Elle apparaît dans la liste. Affectez-la aux classes depuis Classes.",
      });
      setCreateOpen(false);
      setNewNom("");
      setNewCoef("1");
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Création refusée",
        description: error instanceof Error ? error.message : "Réessayez",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={portalTitleClass}>Matières</h1>
          <p className={`mt-1 ${portalMutedClass}`}>
            Créez les matières avec leur coefficient, puis affectez-les aux classes.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus />
          Ajouter une matière
        </Button>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Matière, classe ou professeur…"
      />

      {status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : null}

      {status === "error" ? (
        <p className="text-sm text-destructive">Impossible de charger les matières.</p>
      ) : null}

      {status === "ready" && filtered.length === 0 ? (
        <div className={`${portalPanelClass} flex flex-col items-center gap-3 py-14 text-center`}>
          <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
          <p className="font-medium text-foreground">Aucune matière</p>
          <p className={portalMutedClass}>
            Créez une matière avec son coefficient, puis affectez-la depuis{" "}
            <Link href="/prefet/classes" className={portalLinkClass}>
              Classes
            </Link>
            .
          </p>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus />
            Ajouter une matière
          </Button>
        </div>
      ) : null}

      <div className="space-y-4">
        {filtered.map((matiere) => (
          <article key={matiere.id} className={portalPanelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{matiere.nom}</h2>
                <p className={portalMutedClass}>
                  {matiere.affectations.length === 0
                    ? "Pas encore affectée à une classe"
                    : `${matiere.affectations.length} classe${matiere.affectations.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Coef.
                <Input
                  type="number"
                  min={0.25}
                  max={20}
                  step={0.25}
                  className="h-9 w-20"
                  defaultValue={matiere.coefficientDefaut}
                  disabled={busyId === matiere.id}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (!Number.isFinite(value) || value < 0.25 || value > 20) {
                      e.target.value = String(matiere.coefficientDefaut);
                      return;
                    }
                    if (value === matiere.coefficientDefaut) return;
                    void saveCoefDefaut(matiere.id, value);
                  }}
                />
              </label>
            </div>
            {matiere.affectations.length === 0 ? (
              <p className={`mt-3 text-sm ${portalMutedClass}`}>
                Affectez cette matière depuis{" "}
                <Link href="/prefet/classes" className={portalLinkClass}>
                  Classes
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {matiere.affectations.map((a) => (
                  <li
                    key={a.classeMatiereId}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {a.classe}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">{a.niveau}</span>
                      </p>
                      <p className={`text-sm ${portalMutedClass}`}>
                        {a.professeur ?? "Aucun professeur affecté"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une matière</DialogTitle>
            <DialogDescription>
              Définissez le nom et le coefficient. La matière apparaît tout de suite dans la liste.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Nom</span>
              <Input
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                placeholder="Ex. Mathématiques"
                autoFocus
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Coefficient</span>
              <Input
                type="number"
                min={0.25}
                max={20}
                step={0.25}
                value={newCoef}
                onChange={(e) => setNewCoef(e.target.value)}
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={createMatiere} disabled={creating}>
              {creating ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
