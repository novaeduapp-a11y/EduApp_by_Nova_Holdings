"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";

interface Classe {
  id: string;
  nom: string;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
}

interface Periode {
  id: string;
  nom: string;
}

interface Appreciation {
  id: string;
  eleveId: string;
  periodeId: string;
  type: string;
  appreciation: string;
}

export default function AppreciationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [classeId, setClasseId] = useState("");
  const [periodeId, setPeriodeId] = useState("");
  const [selectedEleve, setSelectedEleve] = useState<string>("");
  const [appreciationGenerale, setAppreciationGenerale] = useState("");
  const [appreciationConseil, setAppreciationConseil] = useState("");

  // Charger les classes
  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const response = await apiGet<Classe[]>("/classes");
      return response.data;
    },
  });

  // Charger les périodes
  const { data: periodesData } = useQuery({
    queryKey: ["periodes"],
    queryFn: async () => {
      const response = await apiGet<Periode[]>("/periodes");
      return response.data;
    },
  });

  // Charger les élèves de la classe
  const { data: elevesData } = useQuery({
    queryKey: ["eleves", classeId],
    queryFn: async () => {
      const response = await apiGet<Eleve[]>(`/eleves?classeId=${classeId}`);
      return response.data;
    },
    enabled: !!classeId,
  });

  // Charger les appréciations existantes
  const { data: appreciationsData } = useQuery({
    queryKey: ["appreciations", selectedEleve, periodeId],
    queryFn: async () => {
      const response = await apiGet<Appreciation[]>(
        `/appreciations?eleveId=${selectedEleve}&periodeId=${periodeId}`
      );
      return response.data;
    },
    enabled: !!selectedEleve && !!periodeId,
  });

  // Mettre à jour les champs quand les appréciations sont chargées
  useState(() => {
    if (appreciationsData) {
      const generale = appreciationsData.find((a) => a.type === "GENERALE");
      const conseil = appreciationsData.find((a) => a.type === "CONSEIL_CLASSE");
      if (generale) setAppreciationGenerale(generale.appreciation);
      if (conseil) setAppreciationConseil(conseil.appreciation);
    }
  });

  // Mutation pour sauvegarder
  const saveAppreciation = useMutation({
    mutationFn: async (data: { type: string; appreciation: string }) => {
      return apiPost("/appreciations", {
        eleveId: selectedEleve,
        periodeId,
        type: data.type,
        appreciation: data.appreciation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appreciations"] });
      toast({ title: "Succès", description: "Appréciation enregistrée" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer" });
    },
  });

  const handleSaveGenerale = () => {
    if (!appreciationGenerale.trim()) return;
    saveAppreciation.mutate({ type: "GENERALE", appreciation: appreciationGenerale });
  };

  const handleSaveConseil = () => {
    if (!appreciationConseil.trim()) return;
    saveAppreciation.mutate({ type: "CONSEIL_CLASSE", appreciation: appreciationConseil });
  };

  const classes = classesData || [];
  const periodes = periodesData || [];
  const eleves = elevesData || [];


  // Effet pour charger les appréciations
  if (appreciationsData && selectedEleve && periodeId) {
    const generale = appreciationsData.find((a) => a.type === "GENERALE");
    const conseil = appreciationsData.find((a) => a.type === "CONSEIL_CLASSE");
    if (generale && appreciationGenerale !== generale.appreciation) {
      setAppreciationGenerale(generale.appreciation);
    }
    if (conseil && appreciationConseil !== conseil.appreciation) {
      setAppreciationConseil(conseil.appreciation);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appréciations"
        description="Saisissez les appréciations pour les bulletins"
      />

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sélection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={classeId} onValueChange={(v) => { setClasseId(v); setSelectedEleve(""); }}>
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
              <Label>Période</Label>
              <Select value={periodeId} onValueChange={setPeriodeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  {periodes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Élève</Label>
              <Select 
                value={selectedEleve} 
                onValueChange={(v) => { 
                  setSelectedEleve(v); 
                  setAppreciationGenerale(""); 
                  setAppreciationConseil(""); 
                }}
                disabled={!classeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un élève" />
                </SelectTrigger>
                <SelectContent>
                  {eleves.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.prenom} {e.nom} ({e.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'appréciations */}
      {selectedEleve && periodeId ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Appréciation Générale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Appréciation Générale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Élève sérieux et appliqué. Bons résultats dans l'ensemble. Doit continuer ses efforts."
                value={appreciationGenerale}
                onChange={(e) => setAppreciationGenerale(e.target.value)}
                rows={5}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {appreciationGenerale.length} caractères
                </p>
                <Button onClick={handleSaveGenerale} disabled={saveAppreciation.isPending}>
                  {saveAppreciation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appréciation Conseil de Classe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Avis du Conseil de Classe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Passage en classe supérieure. Félicitations du conseil."
                value={appreciationConseil}
                onChange={(e) => setAppreciationConseil(e.target.value)}
                rows={5}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {appreciationConseil.length} caractères
                </p>
                <Button onClick={handleSaveConseil} disabled={saveAppreciation.isPending}>
                  {saveAppreciation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez une classe, une période et un élève pour saisir les appréciations
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">💡 Suggestions d&apos;appréciations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm text-blue-800">
            <p><strong>Très bien :</strong> Excellent trimestre. Élève brillant et très impliqué. Félicitations !</p>
            <p><strong>Bien :</strong> Bon trimestre. Travail régulier et sérieux. Continuez ainsi.</p>
            <p><strong>Assez bien :</strong> Trimestre satisfaisant. Des efforts à poursuivre pour progresser.</p>
            <p><strong>Passable :</strong> Résultats moyens. Plus de rigueur et d&apos;attention sont nécessaires.</p>
            <p><strong>Insuffisant :</strong> Trimestre difficile. Un travail plus soutenu est indispensable.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
