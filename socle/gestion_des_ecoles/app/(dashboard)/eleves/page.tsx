"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Search, MoreHorizontal, Eye, Pencil, Trash2, Loader2, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEleves, useCreateEleve, useUpdateEleve, useDeleteEleve } from "@/hooks/use-eleves";
import { useClasses } from "@/hooks/use-classes";
import { EleveForm } from "@/components/eleves/eleve-form";
import { ImportExportDialog } from "@/components/eleves/import-export-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { CreateEleveInput } from "@/lib/validations/eleve";
import type { EleveWithClasse } from "@/types";

export default function ElevesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState<EleveWithClasse | null>(null);
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; matricule: string; password: string }>({
    open: false,
    matricule: "",
    password: "",
  });
  const [copied, setCopied] = useState(false);

  const { data: elevesData, isLoading } = useEleves({
    page,
    limit: 10,
    search: search || undefined,
    classeId: classeFilter !== "all" ? classeFilter : undefined,
  });

  const { data: classesData } = useClasses();
  const createEleve = useCreateEleve();
  const updateEleve = useUpdateEleve();
  const deleteEleve = useDeleteEleve();

  const eleves = elevesData?.data || [];
  const meta = elevesData?.meta;
  const classes = classesData?.data || [];

  const handleSubmitEleve = async (data: CreateEleveInput & { createAccount?: boolean }) => {
    try {
      if (selectedEleve) {
        await updateEleve.mutateAsync({ id: selectedEleve.id, data });
        toast({ title: "Succès", description: "Élève modifié avec succès" });
      } else {
        const result = await createEleve.mutateAsync(data);
        // Afficher les identifiants si un compte a été créé
        if (result?.accountCreated && result?.credentials) {
          setCredentialsDialog({
            open: true,
            matricule: result.credentials.matricule,
            password: result.credentials.password,
          });
        } else {
          toast({ title: "Succès", description: "Élève inscrit avec succès" });
        }
      }
      setFormOpen(false);
      setSelectedEleve(null);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: selectedEleve ? "Impossible de modifier l'élève" : "Impossible d'inscrire l'élève" });
    }
  };

  const handleOpenEdit = (eleve: EleveWithClasse) => {
    setSelectedEleve(eleve);
    setFormOpen(true);
  };

  const handleDeleteEleve = async () => {
    if (!selectedEleve) return;
    try {
      await deleteEleve.mutateAsync(selectedEleve.id);
      toast({ title: "Succès", description: "Élève supprimé" });
      setDeleteDialogOpen(false);
      setSelectedEleve(null);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'élève" });
    }
  };

  const stats = {
    total: meta?.total || 0,
    garcons: eleves.filter((e) => e.sexe === "M").length,
    filles: eleves.filter((e) => e.sexe === "F").length,
    actifs: eleves.filter((e) => e.actif).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Élèves"
        description="Gérez les inscriptions et les informations des élèves"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportExportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import/Export
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel élève
          </Button>
        </div>
      </PageHeader>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total élèves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Garçons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.garcons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.filles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.actifs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classeFilter} onValueChange={setClasseFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((classe) => (
                  <SelectItem key={classe.id} value={classe.id}>
                    {classe.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des élèves */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>Date de naissance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : eleves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Aucun élève trouvé
                  </TableCell>
                </TableRow>
              ) : (
                eleves.map((eleve) => (
                  <TableRow key={eleve.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className={
                              eleve.sexe === "M"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-pink-100 text-pink-700"
                            }
                          >
                            {eleve.prenom[0]}
                            {eleve.nom[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {eleve.prenom} {eleve.nom}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 py-0.5 rounded">
                        {eleve.matricule}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{eleve.classe?.nom}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={eleve.sexe === "M" ? "default" : "secondary"}
                        className={
                          eleve.sexe === "M"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "bg-pink-100 text-pink-700 hover:bg-pink-100"
                        }
                      >
                        {eleve.sexe === "M" ? "Masculin" : "Féminin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(eleve.dateNaissance).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={eleve.actif ? "default" : "destructive"}
                          className={
                            eleve.actif
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : ""
                          }
                        >
                          {eleve.actif ? "Actif" : "Inactif"}
                        </Badge>
                        {(eleve as unknown as { enDifficulte?: boolean }).enDifficulte && (
                          <Badge variant="destructive" className="bg-red-500 text-white">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            À suivre
                          </Badge>
                        )}
                        {(eleve as unknown as { derniereMoyenne?: number }).derniereMoyenne !== null && !(eleve as unknown as { enDifficulte?: boolean }).enDifficulte && (
                          <Badge variant="outline" className="text-xs">
                            Moy: {(eleve as unknown as { derniereMoyenne?: number }).derniereMoyenne?.toFixed(1)}/20
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/eleves/${eleve.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(eleve)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedEleve(eleve);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} sur {meta.totalPages} ({meta.total} élèves)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'ajout/modification */}
      <EleveForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setSelectedEleve(null); }}
        onSubmit={handleSubmitEleve}
        isLoading={createEleve.isPending || updateEleve.isPending}
        eleve={selectedEleve}
      />

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer l'élève"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedEleve?.prenom} ${selectedEleve?.nom} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        onConfirm={handleDeleteEleve}
        variant="destructive"
        isLoading={deleteEleve.isPending}
      />

      {/* Dialog Import/Export */}
      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
      />

      {/* Dialog des identifiants élève */}
      <Dialog open={credentialsDialog.open} onOpenChange={(open) => { setCredentialsDialog({ ...credentialsDialog, open }); setCopied(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Compte élève créé avec succès !
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Voici les identifiants de connexion de l&apos;élève. Notez-les ou copiez-les car le mot de passe ne sera plus affiché.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Matricule :</span>
                <span className="font-mono font-bold text-lg">{credentialsDialog.matricule}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mot de passe :</span>
                <span className="font-mono font-bold text-lg">{credentialsDialog.password}</span>
              </div>
            </div>
            <Button
              className="w-full"
              variant={copied ? "outline" : "default"}
              onClick={() => {
                navigator.clipboard.writeText(`Matricule: ${credentialsDialog.matricule}\nMot de passe: ${credentialsDialog.password}`);
                setCopied(true);
                toast({ title: "Copié !", description: "Les identifiants ont été copiés dans le presse-papier" });
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier les identifiants
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
