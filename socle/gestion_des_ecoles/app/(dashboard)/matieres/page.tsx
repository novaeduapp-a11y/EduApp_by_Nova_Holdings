"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDomaines, useCreateMatiere, useUpdateMatiere, useDeleteMatiere } from "@/hooks/use-matieres";

interface MatiereForm {
  id?: string;
  nom: string;
  code: string;
  coefficient: number;
  domaineId: string;
}

const initialForm: MatiereForm = { nom: "", code: "", coefficient: 1, domaineId: "" };

export default function MatieresPage() {
  const { toast } = useToast();
  const { data: domaines, isLoading } = useDomaines();
  const createMatiere = useCreateMatiere();
  const updateMatiere = useUpdateMatiere();
  const deleteMatiere = useDeleteMatiere();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<MatiereForm | null>(null);
  const [form, setForm] = useState<MatiereForm>(initialForm);

  const handleOpenCreate = () => {
    setForm(initialForm);
    setSelectedMatiere(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (matiere: MatiereForm) => {
    setForm(matiere);
    setSelectedMatiere(matiere);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (matiere: MatiereForm) => {
    setSelectedMatiere(matiere);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.code || !form.domaineId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs" });
      return;
    }

    // S'assurer que coefficient est un number
    const dataToSend = {
      ...form,
      coefficient: typeof form.coefficient === "string" ? parseInt(form.coefficient, 10) : form.coefficient,
    };

    try {
      if (selectedMatiere?.id) {
        await updateMatiere.mutateAsync({ id: selectedMatiere.id, data: dataToSend });
        toast({ title: "Succès", description: "Matière modifiée avec succès" });
      } else {
        await createMatiere.mutateAsync(dataToSend);
        toast({ title: "Succès", description: "Matière créée avec succès" });
      }
      setIsModalOpen(false);
      setForm(initialForm);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue" });
    }
  };

  const handleDelete = async () => {
    if (!selectedMatiere?.id) return;
    try {
      await deleteMatiere.mutateAsync(selectedMatiere.id);
      toast({ title: "Succès", description: "Matière supprimée avec succès" });
      setIsDeleteOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer cette matière" });
    }
  };

  const totalMatieres = domaines?.reduce((acc, d) => acc + d.matieres.length, 0) || 0;
  const totalCoefficients = domaines?.reduce((acc, d) => acc + d.matieres.reduce((a, m) => a + m.coefficient, 0), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Matières"
        description="Gérez les matières et les domaines d'apprentissage"
      >
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle matière
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Domaines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domaines?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Matières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatieres}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total coefficients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoefficients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste par domaine */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {domaines?.map((domaine) => (
            <Card key={domaine.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{domaine.nom}</CardTitle>
                    <CardDescription>Code: {domaine.code}</CardDescription>
                  </div>
                  <Badge variant="secondary">{domaine.matieres.length} matière(s)</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Coefficient</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domaine.matieres.map((matiere) => (
                      <TableRow key={matiere.id}>
                        <TableCell className="font-medium">{matiere.nom}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-1 py-0.5 rounded">{matiere.code}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">×{matiere.coefficient}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit({ ...matiere, domaineId: domaine.id })}>
                                <Pencil className="h-4 w-4 mr-2" />Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleOpenDelete({ ...matiere, domaineId: domaine.id })}>
                                <Trash2 className="h-4 w-4 mr-2" />Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Création/Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMatiere?.id ? "Modifier la matière" : "Nouvelle matière"}</DialogTitle>
            <DialogDescription>
              {selectedMatiere?.id ? "Modifiez les informations de la matière" : "Ajoutez une nouvelle matière"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Français" />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Ex: FRANC" />
            </div>
            <div className="space-y-2">
              <Label>Domaine *</Label>
              <Select value={form.domaineId} onValueChange={(v) => setForm({ ...form, domaineId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un domaine" />
                </SelectTrigger>
                <SelectContent>
                  {domaines?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coefficient</Label>
              <Input type="number" min={1} max={10} value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMatiere.isPending || updateMatiere.isPending}>
              {(createMatiere.isPending || updateMatiere.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedMatiere?.id ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer la matière"
        description={`Êtes-vous sûr de vouloir supprimer la matière "${selectedMatiere?.nom}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        isLoading={deleteMatiere.isPending}
      />
    </div>
  );
}
