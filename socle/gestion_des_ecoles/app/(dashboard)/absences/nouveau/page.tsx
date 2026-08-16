"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/use-classes";
import { useEleves } from "@/hooks/use-eleves";
import { useCreateAbsence } from "@/hooks/use-absences";

export default function NouvelleAbsencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialClasseId = searchParams.get("classeId") || "";

  const [classeId, setClasseId] = useState(initialClasseId);
  const [eleveId, setEleveId] = useState("");
  const [dateAbsence, setDateAbsence] = useState(new Date().toISOString().split("T")[0]);
  const [periode, setPeriode] = useState<"MATIN" | "APRES_MIDI" | "JOURNEE">("JOURNEE");
  const [justifiee, setJustifiee] = useState(false);
  const [motif, setMotif] = useState("");

  const { data: classesData } = useClasses();
  const { data: elevesData } = useEleves({ classeId, limit: 100 });
  const createAbsence = useCreateAbsence();

  const classes = classesData?.data || [];
  const eleves = elevesData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eleveId || !dateAbsence) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires" });
      return;
    }

    try {
      await createAbsence.mutateAsync({
        eleveId,
        dateAbsence,
        periode,
        justifiee,
        motif: motif || undefined,
      });
      toast({ title: "Succès", description: "Absence enregistrée avec succès" });
      router.push("/absences");
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer l'absence" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nouvelle absence" description="Enregistrer une absence pour un élève">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informations de l&apos;absence</CardTitle>
          <CardDescription>Remplissez les informations de l&apos;absence</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Classe *</Label>
                <Select value={classeId} onValueChange={(v) => { setClasseId(v); setEleveId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Élève *</Label>
                <Select value={eleveId} onValueChange={setEleveId} disabled={!classeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={classeId ? "Sélectionner un élève" : "Choisir d'abord une classe"} />
                  </SelectTrigger>
                  <SelectContent>
                    {eleves.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date de l&apos;absence *</Label>
                <Input type="date" value={dateAbsence} onChange={(e) => setDateAbsence(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Période</Label>
                <Select value={periode} onValueChange={(v) => setPeriode(v as typeof periode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATIN">Matin</SelectItem>
                    <SelectItem value="APRES_MIDI">Après-midi</SelectItem>
                    <SelectItem value="JOURNEE">Journée entière</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Absence justifiée</Label>
                <p className="text-sm text-muted-foreground">L&apos;absence est-elle justifiée ?</p>
              </div>
              <Switch checked={justifiee} onCheckedChange={setJustifiee} />
            </div>

            {justifiee && (
              <div className="space-y-2">
                <Label>Motif de l&apos;absence</Label>
                <Textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex: Rendez-vous médical, fête familiale..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={createAbsence.isPending}>
                {createAbsence.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
