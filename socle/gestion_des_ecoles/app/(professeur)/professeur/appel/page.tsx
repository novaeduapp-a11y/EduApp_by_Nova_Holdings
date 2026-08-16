"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Classe = {
  id: string;
  nom: string;
  niveau: string;
  effectif: number;
};

type Ligne = {
  eleveId: string;
  nom: string;
  prenom: string;
  matricule: string;
  statut: "PRESENT" | "ABSENT" | "RETARD";
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ProfesseurAppelPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState("");
  const [date, setDate] = useState(today);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/prof/classes");
        const body = await res.json();
        const list = (body.data ?? []) as Classe[];
        setClasses(list);
        if (list[0]) setClasseId(list[0].id);
      } catch {
        toast({ variant: "destructive", title: "Impossible de charger les classes" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!classeId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/staff/prof/appel?classeId=${encodeURIComponent(classeId)}&date=${date}`
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setLignes(body.data.eleves);
      } catch {
        toast({ variant: "destructive", title: "Impossible de charger l’appel" });
        setLignes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [classeId, date]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/prof/appel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId,
          date,
          lignes: lignes.map((ligne) => ({ eleveId: ligne.eleveId, statut: ligne.statut })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Feuille d’appel enregistrée" });
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
      <div className="flex items-center gap-4">
        <Link href="/professeur">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Feuille d’appel
          </h1>
          <p className="text-muted-foreground">Présent, absent ou retard — vos classes uniquement.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classe et date</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <select
            className="h-10 rounded-md border px-3 min-w-[180px]"
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
          >
            {classes.map((classe) => (
              <option key={classe.id} value={classe.id}>
                {classe.nom} ({classe.effectif})
              </option>
            ))}
          </select>
          <input
            type="date"
            className="h-10 rounded-md border px-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button onClick={save} disabled={saving || lignes.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-48" />
          ) : lignes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun élève dans cette classe.</p>
          ) : (
            <div className="space-y-3">
              {lignes.map((ligne) => (
                <div
                  key={ligne.eleveId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {ligne.prenom} {ligne.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">{ligne.matricule}</p>
                  </div>
                  <div className="flex gap-2">
                    {(["PRESENT", "ABSENT", "RETARD"] as const).map((statut) => {
                      const active = ligne.statut === statut;
                      const label = statut === "PRESENT" ? "Présent" : statut === "ABSENT" ? "Absent" : "Retard";
                      return (
                        <Button
                          key={statut}
                          type="button"
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className={
                            active && statut === "ABSENT"
                              ? "bg-red-600 hover:bg-red-700"
                              : active && statut === "RETARD"
                                ? "bg-amber-600 hover:bg-amber-700"
                                : undefined
                          }
                          onClick={() =>
                            setLignes((prev) =>
                              prev.map((item) =>
                                item.eleveId === ligne.eleveId ? { ...item, statut } : item
                              )
                            )
                          }
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
