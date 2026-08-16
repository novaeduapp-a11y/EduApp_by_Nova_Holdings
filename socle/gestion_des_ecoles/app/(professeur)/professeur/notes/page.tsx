"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, BookOpen, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";

interface Evaluation {
  id: string;
  titre: string;
  type: string;
  noteSur: number;
  classe: { id: string; nom: string };
  matiere: { id: string; nom: string };
}

interface EleveNote {
  eleveId: string;
  nom: string;
  prenom: string;
  matricule: string;
  note: number | null;
  absent: boolean;
}

export default function ProfesseurNotesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>("");
  const [notes, setNotes] = useState<Record<string, { note: string; absent: boolean }>>({});

  const { data: evaluations, isLoading: loadingEvaluations } = useQuery({
    queryKey: ["professeur-evaluations-for-notes"],
    queryFn: async () => {
      const response = await apiGet<Evaluation[]>("/professeur/evaluations?forNotes=true");
      return response.data;
    },
  });

  const { data: elevesNotes, isLoading: loadingEleves } = useQuery({
    queryKey: ["professeur-eleves-notes", selectedEvaluation],
    queryFn: async () => {
      const response = await apiGet<EleveNote[]>(`/professeur/evaluations/${selectedEvaluation}/notes`);
      return response.data;
    },
    enabled: !!selectedEvaluation,
  });

  const saveNotes = useMutation({
    mutationFn: async (data: { evaluationId: string; notes: { eleveId: string; note: number | null; absent: boolean }[] }) => {
      return apiPost("/professeur/notes", data);
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Notes enregistrées avec succès" });
      queryClient.invalidateQueries({ queryKey: ["professeur-eleves-notes", selectedEvaluation] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les notes" });
    },
  });

  const handleNoteChange = (eleveId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], note: value, absent: false },
    }));
  };

  const handleAbsentChange = (eleveId: string, absent: boolean) => {
    setNotes(prev => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], absent, note: absent ? "" : prev[eleveId]?.note || "" },
    }));
  };

  const handleSave = () => {
    if (!selectedEvaluation || !elevesNotes) return;

    const notesToSave = elevesNotes.map(eleve => {
      const noteData = notes[eleve.eleveId];
      return {
        eleveId: eleve.eleveId,
        note: noteData?.absent ? null : (noteData?.note ? parseFloat(noteData.note) : eleve.note),
        absent: noteData?.absent ?? eleve.absent,
      };
    });

    saveNotes.mutate({ evaluationId: selectedEvaluation, notes: notesToSave });
  };

  // Initialiser les notes quand les données arrivent
  if (elevesNotes && Object.keys(notes).length === 0) {
    const initialNotes: Record<string, { note: string; absent: boolean }> = {};
    elevesNotes.forEach(eleve => {
      initialNotes[eleve.eleveId] = {
        note: eleve.note?.toString() || "",
        absent: eleve.absent,
      };
    });
    setNotes(initialNotes);
  }

  const selectedEval = evaluations?.find(e => e.id === selectedEvaluation);

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
            <BookOpen className="h-6 w-6" />
            Saisie des Notes
          </h1>
          <p className="text-muted-foreground">Entrez les notes de vos évaluations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une évaluation</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEvaluations ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedEvaluation} onValueChange={(v) => { setSelectedEvaluation(v); setNotes({}); }}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une évaluation" />
              </SelectTrigger>
              <SelectContent>
                {evaluations?.map((evaluation) => (
                  <SelectItem key={evaluation.id} value={evaluation.id}>
                    {evaluation.titre} - {evaluation.classe.nom} ({evaluation.matiere.nom})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedEvaluation && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedEval?.titre}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedEval?.classe.nom} - {selectedEval?.matiere.nom} | Note sur {selectedEval?.noteSur}
              </p>
            </div>
            <Button onClick={handleSave} disabled={saveNotes.isPending}>
              {saveNotes.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </CardHeader>
          <CardContent>
            {loadingEleves ? (
              <Skeleton className="h-64" />
            ) : elevesNotes && elevesNotes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead className="w-32">Note / {selectedEval?.noteSur}</TableHead>
                    <TableHead className="w-24">Absent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elevesNotes.map((eleve) => (
                    <TableRow key={eleve.eleveId}>
                      <TableCell className="font-mono">{eleve.matricule}</TableCell>
                      <TableCell className="font-medium">{eleve.nom}</TableCell>
                      <TableCell>{eleve.prenom}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={selectedEval?.noteSur}
                          step="0.5"
                          value={notes[eleve.eleveId]?.note || ""}
                          onChange={(e) => handleNoteChange(eleve.eleveId, e.target.value)}
                          disabled={notes[eleve.eleveId]?.absent}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={notes[eleve.eleveId]?.absent || false}
                          onChange={(e) => handleAbsentChange(eleve.eleveId, e.target.checked)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucun élève dans cette classe</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
