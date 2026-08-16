"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList, Calculator, Search, MoreHorizontal, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useEvaluations, useDeleteEvaluation } from "@/hooks/use-notes";
import { useClasses } from "@/hooks/use-classes";
import { useToast } from "@/hooks/use-toast";

const typeColors: Record<string, string> = {
  DEVOIR: "bg-blue-100 text-blue-700",
  COMPOSITION: "bg-purple-100 text-purple-700",
  INTERROGATION: "bg-orange-100 text-orange-700",
  TP: "bg-green-100 text-green-700",
};

const typeLabels: Record<string, string> = {
  DEVOIR: "Devoir",
  COMPOSITION: "Composition",
  INTERROGATION: "Interrogation",
  TP: "TP",
};

interface EvaluationItem {
  id: string;
  titre: string;
  type: string;
  dateEvaluation: string;
  noteSur: number;
  coefficient: number;
  matiere: { id: string; nom: string };
  classe: { id: string; nom: string; _count?: { eleves: number } };
  _count?: { notes: number };
}

export default function NotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationItem | null>(null);

  const { data: evaluationsData, isLoading } = useEvaluations({
    classeId: classeFilter !== "all" ? classeFilter : undefined,
  });
  const { data: classesData } = useClasses();
  const deleteEvaluation = useDeleteEvaluation();

  const evaluations = (evaluationsData?.data || []) as EvaluationItem[];
  const classes = classesData?.data || [];

  const filteredEvaluations = evaluations.filter((e) =>
    e.titre.toLowerCase().includes(search.toLowerCase()) ||
    e.matiere.nom.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDelete = (evaluation: EvaluationItem) => {
    setSelectedEvaluation(evaluation);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedEvaluation) return;
    try {
      await deleteEvaluation.mutateAsync(selectedEvaluation.id);
      toast({ title: "Succès", description: "Évaluation supprimée" });
      setDeleteDialogOpen(false);
      setSelectedEvaluation(null);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'évaluation" });
    }
  };

  const stats = {
    total: evaluations.length,
    devoirs: evaluations.filter((e) => e.type === "DEVOIR").length,
    compositions: evaluations.filter((e) => e.type === "COMPOSITION").length,
    interrogations: evaluations.filter((e) => e.type === "INTERROGATION").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Notes"
        description="Gérez les évaluations et saisissez les notes"
      >
        <div className="flex gap-2">
          <Link href="/notes/moyennes">
            <Button variant="outline" size="sm">
              <Calculator className="h-4 w-4 mr-2" />
              Voir les moyennes
            </Button>
          </Link>
          <Link href="/notes/saisie">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle évaluation
            </Button>
          </Link>
        </div>
      </PageHeader>

      <Tabs defaultValue="evaluations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evaluations">
            <ClipboardList className="h-4 w-4 mr-2" />
            Évaluations
          </TabsTrigger>
          <TabsTrigger value="saisie">
            <Pencil className="h-4 w-4 mr-2" />
            Saisie rapide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evaluations" className="space-y-4">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total évaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Devoirs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.devoirs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compositions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.compositions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Interrogations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.interrogations}</div>
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
                    placeholder="Rechercher une évaluation..."
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
                      <SelectItem key={classe.id} value={classe.id}>{classe.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des évaluations */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Évaluation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Classe</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Note sur</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvaluations.map((evaluation) => (
                        <TableRow key={evaluation.id}>
                          <TableCell className="font-medium">{evaluation.titre}</TableCell>
                          <TableCell>
                            <Badge className={typeColors[evaluation.type]} variant="secondary">
                              {typeLabels[evaluation.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>{evaluation.matiere?.nom}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{evaluation.classe?.nom}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(evaluation.dateEvaluation).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell>{evaluation.noteSur}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/notes/saisie?evaluationId=${evaluation.id}`)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Saisir les notes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/notes/saisie?evaluationId=${evaluation.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleOpenDelete(evaluation)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredEvaluations.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      Aucune évaluation trouvée
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saisie">
          <Card>
            <CardHeader>
              <CardTitle>Saisie rapide des notes</CardTitle>
              <CardDescription>
                Sélectionnez une classe et une évaluation pour saisir les notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une évaluation pour commencer la saisie</p>
                <Link href="/notes/saisie">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une évaluation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer l'évaluation"
        description={`Êtes-vous sûr de vouloir supprimer "${selectedEvaluation?.titre}" ? Toutes les notes associées seront également supprimées.`}
        confirmText="Supprimer"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteEvaluation.isPending}
      />
    </div>
  );
}
