"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, BookOpen, Pencil, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading-spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { useCycles } from "@/hooks/use-classes";

interface Classe {
  id: string;
  nom: string;
  niveau: string;
  anneeScolaire: string;
  cycleId: string;
  effectifMax: number;
  cycle?: { id: string; nom: string };
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  sexe: "M" | "F";
  dateNaissance: string;
  actif: boolean;
}

interface ClasseForm {
  nom: string;
  niveau: string;
  anneeScolaire: string;
  cycleId: string;
  effectifMax: number;
}

export default function ClasseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const classeId = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [form, setForm] = useState<ClasseForm>({
    nom: "",
    niveau: "",
    anneeScolaire: "",
    cycleId: "",
    effectifMax: 30,
  });

  const { data: cyclesData } = useCycles();
  const cycles = cyclesData || [];

  const { data: classeData, isLoading } = useQuery({
    queryKey: ["classe", classeId],
    queryFn: async () => {
      const response = await apiGet<Classe>(`/classes/${classeId}`);
      return response.data;
    },
    enabled: !!classeId,
  });

  const { data: elevesData } = useQuery({
    queryKey: ["eleves", { classeId }],
    queryFn: async () => {
      const response = await apiGet<Eleve[]>("/eleves", { classeId, limit: 100 });
      return response.data || [];
    },
    enabled: !!classeId,
  });

  const handleOpenEdit = () => {
    if (classe) {
      setForm({
        nom: classe.nom,
        niveau: classe.niveau,
        anneeScolaire: classe.anneeScolaire,
        cycleId: classe.cycleId || "",
        effectifMax: classe.effectifMax,
      });
      setIsEditOpen(true);
    }
  };

  const handleUpdate = async () => {
    if (!form.nom || !form.niveau || !form.anneeScolaire || !form.cycleId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs" });
      return;
    }

    setIsUpdating(true);
    try {
      await apiPut(`/classes/${classeId}`, form);
      toast({ title: "Succès", description: "Classe modifiée avec succès" });
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["classe", classeId] });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier la classe" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <PageLoading />;

  const classe = classeData;
  const eleves = elevesData || [];
  const fillPercentage = classe ? (eleves.length / classe.effectifMax) * 100 : 0;

  if (!classe) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Classe non trouvée</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={classe.nom} description={`${classe.cycle?.nom || ""} - Année ${classe.anneeScolaire}`}>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Retour
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenEdit}>
            <Pencil className="h-4 w-4 mr-2" />Modifier
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Infos classe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />Effectif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{eleves.length}</p>
              <p className="text-sm text-muted-foreground">/ {classe.effectifMax} places</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Remplissage</span>
                <span>{Math.round(fillPercentage)}%</span>
              </div>
              <Progress value={fillPercentage} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">{eleves.filter((e) => e.sexe === "M").length}</p>
                <p className="text-xs text-muted-foreground">Garçons</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-pink-600">{eleves.filter((e) => e.sexe === "F").length}</p>
                <p className="text-xs text-muted-foreground">Filles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matières */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />Matières enseignées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Français", "Calcul", "Sciences", "Histoire", "Géographie", "EPS"].map((matiere) => (
                <div key={matiere} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{matiere}</span>
                  <Badge variant="outline">Coef. 2</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/eleves?classeId=" + classeId)}>
              <Users className="h-4 w-4 mr-2" />Voir tous les élèves
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/notes/saisie")}>
              <Pencil className="h-4 w-4 mr-2" />Saisir des notes
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/absences/nouveau?classeId=" + classeId)}>
              <UserPlus className="h-4 w-4 mr-2" />Enregistrer une absence
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Liste des élèves */}
      <Card>
        <CardHeader>
          <CardTitle>Élèves de la classe</CardTitle>
          <CardDescription>{eleves.length} élève(s) inscrit(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>Date de naissance</TableHead>
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
                  <TableRow key={eleve.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/eleves/${eleve.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={eleve.sexe === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}>
                            {eleve.prenom[0]}{eleve.nom[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{eleve.prenom} {eleve.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell><code className="text-sm">{eleve.matricule}</code></TableCell>
                    <TableCell>
                      <Badge className={eleve.sexe === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}>
                        {eleve.sexe === "M" ? "M" : "F"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(eleve.dateNaissance).toLocaleDateString("fr-FR")}</TableCell>
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

      {/* Modal Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la classe</DialogTitle>
            <DialogDescription>Modifiez les informations de la classe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: CI-A" />
            </div>
            <div className="space-y-2">
              <Label>Niveau *</Label>
              <Select value={form.niveau} onValueChange={(value) => setForm({ ...form, niveau: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CI">CI</SelectItem>
                  <SelectItem value="CP">CP</SelectItem>
                  <SelectItem value="CE1">CE1</SelectItem>
                  <SelectItem value="CE2">CE2</SelectItem>
                  <SelectItem value="CM1">CM1</SelectItem>
                  <SelectItem value="CM2">CM2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cycle *</Label>
              <Select value={form.cycleId} onValueChange={(value) => setForm({ ...form, cycleId: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>{cycle.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Année scolaire *</Label>
              <Input value={form.anneeScolaire} onChange={(e) => setForm({ ...form, anneeScolaire: e.target.value })} placeholder="Ex: 2024-2025" />
            </div>
            <div className="space-y-2">
              <Label>Effectif maximum</Label>
              <Input type="number" min={1} max={100} value={form.effectifMax} onChange={(e) => setForm({ ...form, effectifMax: parseInt(e.target.value) || 30 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
