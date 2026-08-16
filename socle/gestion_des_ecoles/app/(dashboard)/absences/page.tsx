"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Check, X, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAbsences, useJustifyAbsence, useDeleteAbsence } from "@/hooks/use-absences";

const periodeLabels: Record<string, string> = {
  MATIN: "Matin",
  APRES_MIDI: "Après-midi",
  JOURNEE: "Journée entière",
};

interface AbsenceItem {
  id: string;
  eleve: { prenom: string; nom: string; classe?: { nom: string } };
  dateAbsence: string;
  periode: string;
  justifiee: boolean;
  motif?: string | null;
}

export default function AbsencesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [justifieeFilter, setJustifieeFilter] = useState<string>("all");
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceItem | null>(null);
  const [isJustifyOpen, setIsJustifyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [motif, setMotif] = useState("");

  const { data: absencesData, isLoading } = useAbsences({
    justifiee: justifieeFilter === "all" ? undefined : justifieeFilter === "justifiee",
  });
  const justifyAbsence = useJustifyAbsence();
  const deleteAbsence = useDeleteAbsence();

  const absences = (absencesData?.data || []) as AbsenceItem[];

  const handleOpenJustify = (absence: AbsenceItem) => {
    setSelectedAbsence(absence);
    setMotif("");
    setIsJustifyOpen(true);
  };

  const handleOpenDelete = (absence: AbsenceItem) => {
    setSelectedAbsence(absence);
    setIsDeleteOpen(true);
  };

  const handleJustify = async () => {
    if (!selectedAbsence) return;
    try {
      await justifyAbsence.mutateAsync({ id: selectedAbsence.id, motif });
      toast({ title: "Succès", description: "Absence justifiée avec succès" });
      setIsJustifyOpen(false);
      setSelectedAbsence(null);
      setMotif("");
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de justifier l'absence" });
    }
  };

  const handleDelete = async () => {
    if (!selectedAbsence) return;
    try {
      await deleteAbsence.mutateAsync(selectedAbsence.id);
      toast({ title: "Succès", description: "Absence supprimée" });
      setIsDeleteOpen(false);
      setSelectedAbsence(null);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'absence" });
    }
  };

  const filteredAbsences = absences.filter((absence) => {
    const eleveName = `${absence.eleve.prenom} ${absence.eleve.nom}`.toLowerCase();
    return eleveName.includes(search.toLowerCase());
  });

  const stats = {
    total: absences.length,
    justifiees: absences.filter((a) => a.justifiee).length,
    nonJustifiees: absences.filter((a) => !a.justifiee).length,
  };

  const tauxJustification = stats.total > 0 ? Math.round((stats.justifiees / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Absences"
        description="Suivez et gérez les absences des élèves"
      >
        <Link href="/absences/nouveau">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle absence
          </Button>
        </Link>
      </PageHeader>

      {/* Stats et Graphique */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total absences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Justifiées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.justifiees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Non justifiées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.nonJustifiees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de justification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{tauxJustification}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Répartition</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height={80}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Justifiées", value: stats.justifiees },
                      { name: "Non justifiées", value: stats.nonJustifiees },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground text-center">Aucune donnée</div>
            )}
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
                placeholder="Rechercher un élève..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={justifieeFilter} onValueChange={setJustifieeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="justifiee">Justifiées</SelectItem>
                <SelectItem value="non-justifiee">Non justifiées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des absences */}
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
                    <TableHead>Élève</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAbsences.map((absence) => (
                    <TableRow key={absence.id}>
                      <TableCell className="font-medium">
                        {absence.eleve.prenom} {absence.eleve.nom}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{absence.eleve.classe?.nom || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(absence.dateAbsence).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>{periodeLabels[absence.periode] || absence.periode}</TableCell>
                      <TableCell>
                        {absence.justifiee ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <Check className="h-3 w-3 mr-1" />
                            Justifiée
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            <X className="h-3 w-3 mr-1" />
                            Non justifiée
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {absence.motif || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!absence.justifiee && (
                              <DropdownMenuItem onClick={() => handleOpenJustify(absence)}>
                                <Check className="h-4 w-4 mr-2" />
                                Justifier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleOpenDelete(absence)}>
                              <X className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAbsences.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  Aucune absence trouvée
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de justification */}
      <Dialog open={isJustifyOpen} onOpenChange={setIsJustifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justifier l&apos;absence</DialogTitle>
            <DialogDescription>
              Justifier l&apos;absence de {selectedAbsence?.eleve.prenom} {selectedAbsence?.eleve.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motif de l&apos;absence</Label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Rendez-vous médical, fête familiale..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJustifyOpen(false)}>Annuler</Button>
            <Button onClick={handleJustify} disabled={justifyAbsence.isPending}>
              {justifyAbsence.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Justifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer l'absence"
        description={`Êtes-vous sûr de vouloir supprimer cette absence ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        isLoading={deleteAbsence.isPending}
      />
    </div>
  );
}
