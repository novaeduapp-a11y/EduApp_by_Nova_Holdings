"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EleveToolbar } from "@/components/shared/eleve-toolbar";
import { useToast } from "@/hooks/use-toast";
import {
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

  const saveCoef = async (classeMatiereId: string, coefficient: number) => {
    setBusyId(classeMatiereId);
    try {
      const res = await fetch("/api/staff/prefet/matieres/affectations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classeMatiereId, coefficient }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Enregistrement impossible");
      setMatieres((current) =>
        current.map((m) => ({
          ...m,
          affectations: m.affectations.map((a) =>
            a.classeMatiereId === classeMatiereId ? { ...a, coefficient } : a
          ),
        }))
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className={portalTitleClass}>Matières</h1>
        <p className={`mt-1 ${portalMutedClass}`}>
          Professeurs affectés et coefficients par classe. Seul le préfet règle les coefficients.
        </p>
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
          <p className="font-medium text-foreground">Aucune matière affectée</p>
          <p className={portalMutedClass}>
            Affectez des professeurs aux matières depuis la page Classes.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {filtered.map((matiere) => (
          <article key={matiere.id} className={portalPanelClass}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{matiere.nom}</h2>
                <p className={portalMutedClass}>
                  {matiere.affectations.length} classe
                  {matiere.affectations.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
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
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    Coef.
                    <Input
                      type="number"
                      min={0.25}
                      max={20}
                      step={0.25}
                      className="h-9 w-20"
                      defaultValue={a.coefficient}
                      disabled={busyId === a.classeMatiereId}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (!Number.isFinite(value) || value < 0.25 || value > 20) {
                          e.target.value = String(a.coefficient);
                          return;
                        }
                        if (value === a.coefficient) return;
                        void saveCoef(a.classeMatiereId, value);
                      }}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
