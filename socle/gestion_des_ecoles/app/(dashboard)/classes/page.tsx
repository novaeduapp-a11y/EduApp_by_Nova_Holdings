"use client";

import { useState } from "react";
import { Plus, Users, MoreHorizontal, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useClasses, useCycles, useCreateClasse, useUpdateClasse, useDeleteClasse } from "@/hooks/use-classes";

const cycleColors: Record<string, string> = {
  "Cycle d'Initiation": "bg-blue-100 text-blue-700",
  "Cycle Élémentaire": "bg-green-100 text-green-700",
  "Cycle Moyen": "bg-purple-100 text-purple-700",
};

const niveaux = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

interface ClasseForm {
  id?: string;
  nom: string;
  niveau: string;
  effectifMax: number;
  cycleId: string;
  anneeScolaire: string;
}

const initialForm: ClasseForm = { nom: "", niveau: "", effectifMax: 30, cycleId: "", anneeScolaire: "2025-2026" };

export default function ClassesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: classesData, isLoading } = useClasses();
  const { data: cycles } = useCycles();
  const createClasse = useCreateClasse();
  const updateClasse = useUpdateClasse();
  const deleteClasse = useDeleteClasse();

  const classes = classesData?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState<ClasseForm | null>(null);
  const [form, setForm] = useState<ClasseForm>(initialForm);

  const handleOpenCreate = () => {
    setForm(initialForm);
    setSelectedClasse(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (classe: ClasseForm) => {
    setForm(classe);
    setSelectedClasse(classe);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (classe: ClasseForm) => {
    setSelectedClasse(classe);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.niveau || !form.cycleId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires" });
      return;
    }

    try {
      if (selectedClasse?.id) {
        await updateClasse.mutateAsync({ id: selectedClasse.id, data: form });
        toast({ title: "Succès", description: "Classe modifiée avec succès" });
      } else {
        await createClasse.mutateAsync(form);
        toast({ title: "Succès", description: "Classe créée avec succès" });
      }
      setIsModalOpen(false);
      setForm(initialForm);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue" });
    }
  };

  const handleDelete = async () => {
    if (!selectedClasse?.id) return;
    try {
      await deleteClasse.mutateAsync(selectedClasse.id);
      toast({ title: "Succès", description: "Classe supprimée avec succès" });
      setIsDeleteOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer cette classe (elle contient peut-être des élèves)" });
    }
  };

  // Stats par cycle
  const cycleStats = classes.reduce((acc, classe) => {
    const cycleName = classe.cycle?.nom || "Autre";
    if (!acc[cycleName]) {
      acc[cycleName] = { count: 0, eleves: 0 };
    }
    acc[cycleName].count++;
    acc[cycleName].eleves += classe._count?.eleves || 0;
    return acc;
  }, {} as Record<string, { count: number; eleves: number }>);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Classes"
        description="Gérez les classes et leurs effectifs"
      >
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle classe
        </Button>
      </PageHeader>

      {/* Stats par cycle */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cycle d&apos;Initiation</CardTitle>
            <CardDescription>CI et CP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{cycleStats["Cycle d'Initiation"]?.eleves || 0} élèves</div>
            <p className="text-xs text-muted-foreground">{cycleStats["Cycle d'Initiation"]?.count || 0} classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cycle Élémentaire</CardTitle>
            <CardDescription>CE1 et CE2</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{cycleStats["Cycle Élémentaire"]?.eleves || 0} élèves</div>
            <p className="text-xs text-muted-foreground">{cycleStats["Cycle Élémentaire"]?.count || 0} classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cycle Moyen</CardTitle>
            <CardDescription>CM1 et CM2</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{cycleStats["Cycle Moyen"]?.eleves || 0} élèves</div>
            <p className="text-xs text-muted-foreground">{cycleStats["Cycle Moyen"]?.count || 0} classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des classes */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classe) => {
          const effectif = classe._count?.eleves || 0;
          const fillPercentage = (effectif / classe.effectifMax) * 100;
          return (
            <Card key={classe.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{classe.nom}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/classes/${classe.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEdit({ id: classe.id, nom: classe.nom, niveau: classe.niveau, effectifMax: classe.effectifMax, cycleId: classe.cycleId || "", anneeScolaire: classe.anneeScolaire })}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleOpenDelete({ id: classe.id, nom: classe.nom, niveau: classe.niveau, effectifMax: classe.effectifMax, cycleId: classe.cycleId || "", anneeScolaire: classe.anneeScolaire })}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge className={cycleColors[classe.cycle?.nom || ""] || "bg-gray-100 text-gray-700"} variant="secondary">
                  {classe.cycle?.nom || "Non défini"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-semibold">{effectif}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {classe.effectifMax} élèves
                      </span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Remplissage</span>
                      <span>{Math.round(fillPercentage)}%</span>
                    </div>
                    <Progress value={fillPercentage} className="h-2" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/classes/${classe.id}`)}>
                    Voir la classe
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Modal Création/Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedClasse?.id ? "Modifier la classe" : "Nouvelle classe"}</DialogTitle>
            <DialogDescription>
              {selectedClasse?.id ? "Modifiez les informations de la classe" : "Ajoutez une nouvelle classe"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: CI-A" />
            </div>
            <div className="space-y-2">
              <Label>Niveau *</Label>
              <Select value={form.niveau} onValueChange={(v) => setForm({ ...form, nom: form.nom || `${v}-A`, niveau: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {niveaux.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cycle *</Label>
              <Select value={form.cycleId} onValueChange={(v) => setForm({ ...form, cycleId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Effectif maximum</Label>
              <Input type="number" min={1} max={100} value={form.effectifMax} onChange={(e) => setForm({ ...form, effectifMax: parseInt(e.target.value) || 30 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createClasse.isPending || updateClasse.isPending}>
              {(createClasse.isPending || updateClasse.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedClasse?.id ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer la classe"
        description={`Êtes-vous sûr de vouloir supprimer la classe "${selectedClasse?.nom}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        isLoading={deleteClasse.isPending}
      />
    </div>
  );
}
