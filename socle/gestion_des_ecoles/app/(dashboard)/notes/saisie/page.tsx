"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/use-classes";
import { useMatieres, usePeriodes, useCreateEvaluation, useSaveNotes, useEvaluation } from "@/hooks/use-notes";
import { useEleves } from "@/hooks/use-eleves";

interface NoteEntry {
  eleveId: string;
  note: string;
  absent: boolean;
}

function SaisieNotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const evaluationId = searchParams.get("evaluationId");
  const { toast } = useToast();

  // États pour le formulaire d'évaluation
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<string>("");
  const [classeId, setClasseId] = useState<string>("");
  const [matiereId, setMatiereId] = useState<string>("");
  const [periodeId, setPeriodeId] = useState<string>("");
  const [dateEvaluation, setDateEvaluation] = useState(new Date().toISOString().split("T")[0]);
  const [noteSur, setNoteSur] = useState("20");
  const [coefficient, setCoefficient] = useState("1");

  // État pour les notes
  const [notes, setNotes] = useState<Record<string, NoteEntry>>({});
  const [step, setStep] = useState<"config" | "saisie">("config");
  const isEditMode = !!evaluationId;
  const [dataLoaded, setDataLoaded] = useState(false);

  // Passer en mode saisie si evaluationId est présent
  useEffect(() => {
    if (evaluationId) {
      setStep("saisie");
    }
  }, [evaluationId]);

  // Hooks de données
  const { data: classesData } = useClasses();
  const { data: matieresData } = useMatieres();
  const { data: periodesData } = usePeriodes();
  const { data: existingEvaluation, isLoading: loadingEvaluation } = useEvaluation(evaluationId);
  const { data: elevesData } = useEleves({ classeId, limit: 100 });

  const createEvaluation = useCreateEvaluation();
  const saveNotes = useSaveNotes();

  const classes = classesData?.data || [];
  const matieres = matieresData?.data || [];
  const periodes = periodesData?.data || [];
  const eleves = elevesData?.data || [];

  // Charger les données de l'évaluation existante
  useEffect(() => {
    if (existingEvaluation && evaluationId && !dataLoaded) {
      setTitre(existingEvaluation.titre);
      setType(existingEvaluation.type);
      setClasseId(existingEvaluation.classe?.id || "");
      setMatiereId(existingEvaluation.matiere?.id || "");
      setPeriodeId(existingEvaluation.periode?.id || "");
      setDateEvaluation(existingEvaluation.dateEvaluation?.split("T")[0] || "");
      setNoteSur(String(existingEvaluation.noteSur || 20));
      setCoefficient(String(existingEvaluation.coefficient || 1));
      
      // Charger les notes existantes
      if (existingEvaluation.notes && existingEvaluation.notes.length > 0) {
        const existingNotes: Record<string, NoteEntry> = {};
        existingEvaluation.notes.forEach((n) => {
          existingNotes[n.eleveId] = {
            eleveId: n.eleveId,
            note: n.note !== null ? String(n.note) : "",
            absent: n.absent,
          };
        });
        setNotes(existingNotes);
      }
      setDataLoaded(true);
    }
  }, [existingEvaluation, evaluationId, dataLoaded]);

  const handleStartSaisie = () => {
    if (!titre || !type || !classeId || !matiereId || !periodeId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs" });
      return;
    }

    // Initialiser les notes pour chaque élève
    const initialNotes: Record<string, NoteEntry> = {};
    eleves.forEach((eleve) => {
      initialNotes[eleve.id] = { eleveId: eleve.id, note: "", absent: false };
    });
    setNotes(initialNotes);
    setStep("saisie");
  };

  const handleNoteChange = (eleveId: string, value: string) => {
    const numValue = parseFloat(value);
    if (value === "" || (!isNaN(numValue) && numValue >= 0 && numValue <= parseFloat(noteSur))) {
      setNotes((prev) => ({
        ...prev,
        [eleveId]: { ...prev[eleveId], note: value },
      }));
    }
  };

  const handleAbsentChange = (eleveId: string, absent: boolean) => {
    setNotes((prev) => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], absent, note: absent ? "" : prev[eleveId].note },
    }));
  };

  const handleSave = async () => {
    try {
      let evalId = evaluationId;

      // Si mode création, créer l'évaluation d'abord
      if (!isEditMode) {
        const evaluation = await createEvaluation.mutateAsync({
          titre,
          type,
          classeId,
          matiereId,
          periodeId,
          dateEvaluation,
          noteSur: parseFloat(noteSur),
          coefficient: parseFloat(coefficient),
        });

        if (!evaluation) throw new Error("Erreur création évaluation");
        evalId = evaluation.id;
      }

      if (!evalId) throw new Error("ID évaluation manquant");

      // Sauvegarder les notes
      const notesArray = Object.values(notes).map((n) => ({
        eleveId: n.eleveId,
        note: n.note ? parseFloat(n.note) : null,
        absent: n.absent,
      }));

      await saveNotes.mutateAsync({ evaluationId: evalId, notes: notesArray });

      toast({ title: "Succès", description: isEditMode ? "Notes mises à jour" : "Notes enregistrées avec succès" });
      router.push("/notes");
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les notes" });
    }
  };

  const isLoading = createEvaluation.isPending || saveNotes.isPending;

  // Afficher un loader pendant le chargement de l'évaluation existante
  if (evaluationId && loadingEvaluation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (step === "config") {
    return (
      <div className="space-y-6">
        <PageHeader title="Nouvelle évaluation" description="Configurez l'évaluation avant de saisir les notes">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Retour
          </Button>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Configuration de l&apos;évaluation</CardTitle>
            <CardDescription>Remplissez les informations de l&apos;évaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Titre de l&apos;évaluation *</Label>
                <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Devoir 1 - Français" />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEVOIR">Devoir</SelectItem>
                    <SelectItem value="COMPOSITION">Composition</SelectItem>
                    <SelectItem value="INTERROGATION">Interrogation</SelectItem>
                    <SelectItem value="TP">TP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classe *</Label>
                <Select value={classeId} onValueChange={setClasseId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Matière *</Label>
                <Select value={matiereId} onValueChange={setMatiereId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {matieres.map((m) => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Période *</Label>
                <Select value={periodeId} onValueChange={setPeriodeId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {periodes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={dateEvaluation} onChange={(e) => setDateEvaluation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Note sur</Label>
                <Input type="number" value={noteSur} onChange={(e) => setNoteSur(e.target.value)} min="1" max="100" />
              </div>
              <div className="space-y-2">
                <Label>Coefficient</Label>
                <Input type="number" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} min="1" max="10" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleStartSaisie} disabled={!classeId}>
                Passer à la saisie des notes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // En mode édition, utiliser les élèves de l'évaluation existante si disponibles
  const displayEleves = isEditMode && existingEvaluation?.notes 
    ? existingEvaluation.notes.map(n => n.eleve)
    : eleves;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isEditMode ? `Modifier: ${titre}` : titre} 
        description={`Saisie des notes - ${classes.find((c) => c.id === classeId)?.nom || existingEvaluation?.classe?.nom}`}
      >
        <div className="flex gap-2">
          {!isEditMode && (
            <Button variant="outline" onClick={() => setStep("config")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Modifier config
            </Button>
          )}
          {isEditMode && (
            <Button variant="outline" onClick={() => router.push("/notes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Retour
            </Button>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Saisie des notes</CardTitle>
          <CardDescription>
            {displayEleves.length} élèves - Note sur {noteSur} - Coefficient {coefficient}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Élève</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead className="w-32">Note / {noteSur}</TableHead>
                <TableHead className="w-24">Absent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayEleves.map((eleve, index) => (
                <TableRow key={eleve.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{eleve.prenom} {eleve.nom}</TableCell>
                  <TableCell><code className="text-sm">{eleve.matricule}</code></TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={noteSur}
                      step="0.5"
                      value={notes[eleve.id]?.note || ""}
                      onChange={(e) => handleNoteChange(eleve.id, e.target.value)}
                      disabled={notes[eleve.id]?.absent}
                      className="w-20"
                      placeholder="--"
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={notes[eleve.id]?.absent || false}
                      onCheckedChange={(checked) => handleAbsentChange(eleve.id, checked as boolean)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {displayEleves.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Aucun élève dans cette classe
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          <Check className="h-4 w-4 inline mr-1 text-green-600" />
          {Object.values(notes).filter((n) => n.note || n.absent).length} / {displayEleves.length} notes saisies
        </p>
        <Button onClick={handleSave} disabled={isLoading} size="lg">
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer les notes
        </Button>
      </div>
    </div>
  );
}

export default function SaisieNotesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SaisieNotesContent />
    </Suspense>
  );
}
