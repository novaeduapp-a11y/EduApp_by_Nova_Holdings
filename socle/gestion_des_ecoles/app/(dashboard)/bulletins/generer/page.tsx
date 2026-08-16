"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/use-classes";
import { usePeriodes } from "@/hooks/use-notes";
import { useEleves } from "@/hooks/use-eleves";
import { useGenerateBulletinsBatch } from "@/hooks/use-bulletins";

export default function GenererBulletinsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [classeId, setClasseId] = useState<string>("");
  const [periodeId, setPeriodeId] = useState<string>("");
  const [selectedEleves, setSelectedEleves] = useState<string[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const { data: classesData } = useClasses();
  const { data: periodesData } = usePeriodes();
  const { data: elevesData } = useEleves({ classeId, limit: 100 });
  const generateBulletins = useGenerateBulletinsBatch();

  const classes = classesData?.data || [];
  const periodes = periodesData?.data || [];
  const eleves = elevesData?.data || [];

  const isGenerating = generateBulletins.isPending;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEleves(eleves.map((e) => e.id));
    } else {
      setSelectedEleves([]);
    }
  };

  const handleSelectEleve = (eleveId: string, checked: boolean) => {
    if (checked) {
      setSelectedEleves([...selectedEleves, eleveId]);
    } else {
      setSelectedEleves(selectedEleves.filter((id) => id !== eleveId));
    }
  };

  const handleGenerate = async () => {
    if (!classeId || !periodeId || selectedEleves.length === 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner une classe, une période et au moins un élève" });
      return;
    }

    setGeneratedCount(0);
    setFailedCount(0);

    try {
      const result = await generateBulletins.mutateAsync({
        eleveIds: selectedEleves,
        periodeId,
      });

      setGeneratedCount(result.success);
      setFailedCount(result.failed);

      // Recalculer les rangs après la génération de tous les bulletins
      if (result.success > 0) {
        await fetch("/api/bulletins/recalculer-rangs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classeId, periodeId }),
        });
      }

      if (result.failed === 0) {
        toast({ title: "Succès", description: `${result.success} bulletin(s) généré(s) avec succès` });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Génération partielle", 
          description: `${result.success} réussi(s), ${result.failed} échoué(s)` 
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la génération des bulletins" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Générer des bulletins" description="Sélectionnez les élèves pour générer leurs bulletins">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>
      </PageHeader>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Sélectionnez la classe et la période</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Classe *</label>
              <Select value={classeId} onValueChange={(v) => { setClasseId(v); setSelectedEleves([]); }}>
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
              <label className="text-sm font-medium">Période *</label>
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
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedEleves.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération... ({generatedCount}/{selectedEleves.length})
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Générer {selectedEleves.length > 0 ? `(${selectedEleves.length})` : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des élèves */}
      {classeId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sélection des élèves</CardTitle>
                <CardDescription>{eleves.length} élève(s) dans cette classe</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedEleves.length === eleves.length && eleves.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Tout sélectionner</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Élève</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eleves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun élève dans cette classe
                    </TableCell>
                  </TableRow>
                ) : (
                  eleves.map((eleve) => (
                    <TableRow key={eleve.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEleves.includes(eleve.id)}
                          onCheckedChange={(checked) => handleSelectEleve(eleve.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{eleve.prenom} {eleve.nom}</TableCell>
                      <TableCell><code className="text-sm">{eleve.matricule}</code></TableCell>
                      <TableCell>
                        <Badge className={eleve.sexe === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}>
                          {eleve.sexe === "M" ? "M" : "F"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={eleve.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {eleve.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Résultat */}
      {(generatedCount > 0 || failedCount > 0) && !isGenerating && (
        <Card className={failedCount === 0 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {failedCount === 0 ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                )}
                <div>
                  <p className={`font-medium ${failedCount === 0 ? "text-green-800" : "text-yellow-800"}`}>
                    {generatedCount} bulletin(s) généré(s){failedCount > 0 && `, ${failedCount} échoué(s)`}
                  </p>
                  <p className={`text-sm ${failedCount === 0 ? "text-green-600" : "text-yellow-600"}`}>
                    {failedCount === 0 
                      ? "Les bulletins sont enregistrés. Vous pouvez les voir sur la page Bulletins."
                      : "Certains bulletins n'ont pas pu être générés (pas de notes saisies)."}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className={failedCount === 0 ? "border-green-600 text-green-600 hover:bg-green-100" : "border-yellow-600 text-yellow-600 hover:bg-yellow-100"}
                onClick={() => router.push("/bulletins")}
              >
                Voir les bulletins
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
