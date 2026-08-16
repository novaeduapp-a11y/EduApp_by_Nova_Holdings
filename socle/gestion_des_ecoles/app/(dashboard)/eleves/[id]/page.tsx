"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, User, Phone, Mail, MapPin, Calendar, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading-spinner";
import { useEleve, useDeleteEleve, useUpdateEleve } from "@/hooks/use-eleves";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EleveForm } from "@/components/eleves/eleve-form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { CreateEleveInput } from "@/lib/validations/eleve";

export default function EleveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const eleveId = params.id as string;
  const { data: eleve, isLoading, refetch } = useEleve(eleveId);
  const deleteEleve = useDeleteEleve();
  const updateEleve = useUpdateEleve();

  const handleDelete = async () => {
    try {
      await deleteEleve.mutateAsync(eleveId);
      toast({ title: "Succès", description: "Élève supprimé" });
      router.push("/eleves");
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'élève" });
    }
  };

  const handleUpdate = async (data: CreateEleveInput) => {
    try {
      await updateEleve.mutateAsync({ id: eleveId, data });
      toast({ title: "Succès", description: "Élève modifié avec succès" });
      setEditDialogOpen(false);
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier l'élève" });
    }
  };

  if (isLoading) return <PageLoading />;
  if (!eleve) return <div className="text-center py-10">Élève non trouvé</div>;

  const initials = `${eleve.prenom[0]}${eleve.nom[0]}`.toUpperCase();
  const age = Math.floor((new Date().getTime() - new Date(eleve.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <div className="space-y-6">
      <PageHeader title={`${eleve.prenom} ${eleve.nom}`} description={`Matricule: ${eleve.matricule}`}>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Retour
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}><Pencil className="h-4 w-4 mr-2" />Modifier</Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />Supprimer
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Carte profil */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className={eleve.sexe === "M" ? "bg-blue-100 text-blue-700 text-2xl" : "bg-pink-100 text-pink-700 text-2xl"}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{eleve.prenom} {eleve.nom}</h2>
              <p className="text-muted-foreground">{eleve.matricule}</p>
              <div className="flex gap-2 mt-3">
                <Badge className={eleve.sexe === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}>
                  {eleve.sexe === "M" ? "Masculin" : "Féminin"}
                </Badge>
                <Badge className={eleve.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {eleve.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>Classe: <strong>{eleve.classe?.nom}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(eleve.dateNaissance).toLocaleDateString("fr-FR")} ({age} ans)</span>
              </div>
              {eleve.lieuNaissance && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Né(e) à {eleve.lieuNaissance}</span>
                </div>
              )}
              {eleve.adresse && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{eleve.adresse}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations détaillées */}
        <Card className="md:col-span-2">
          <Tabs defaultValue="parents">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="parents">Parents/Tuteur</TabsTrigger>
                <TabsTrigger value="notes">Notes récentes</TabsTrigger>
                <TabsTrigger value="absences">Absences</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="parents" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  {eleve.nomPere && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium flex items-center gap-2"><User className="h-4 w-4" />Père</h4>
                      <p className="text-sm mt-2">{eleve.nomPere}</p>
                      {eleve.telephonePere && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{eleve.telephonePere}
                        </p>
                      )}
                    </div>
                  )}
                  {eleve.nomMere && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium flex items-center gap-2"><User className="h-4 w-4" />Mère</h4>
                      <p className="text-sm mt-2">{eleve.nomMere}</p>
                      {eleve.telephoneMere && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{eleve.telephoneMere}
                        </p>
                      )}
                    </div>
                  )}
                  {eleve.nomTuteur && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium flex items-center gap-2"><User className="h-4 w-4" />Tuteur</h4>
                      <p className="text-sm mt-2">{eleve.nomTuteur}</p>
                      {eleve.telephoneTuteur && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{eleve.telephoneTuteur}
                        </p>
                      )}
                    </div>
                  )}
                  {eleve.emailParent && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" />Email</h4>
                      <p className="text-sm mt-2">{eleve.emailParent}</p>
                    </div>
                  )}
                </div>
                {!eleve.nomPere && !eleve.nomMere && !eleve.nomTuteur && (
                  <p className="text-center text-muted-foreground py-8">Aucune information sur les parents</p>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead>Évaluation</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eleve.notes && eleve.notes.length > 0 ? (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      eleve.notes.map((note: any) => (
                        <TableRow key={note.id}>
                          <TableCell>{note.evaluation?.matiere?.nom || "-"}</TableCell>
                          <TableCell>{note.evaluation?.titre || "-"}</TableCell>
                          <TableCell>
                            {note.absent ? (
                              <Badge className="bg-orange-100 text-orange-700">Absent</Badge>
                            ) : (
                              <span className={note.note !== null && Number(note.note) < 10 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                {note.note !== null ? `${Number(note.note)}/${Number(note.evaluation?.noteSur) || 20}` : "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {note.evaluation?.dateEvaluation 
                              ? new Date(note.evaluation.dateEvaluation).toLocaleDateString("fr-FR")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Aucune note enregistrée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="absences" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Justifiée</TableHead>
                      <TableHead>Motif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eleve.absences && eleve.absences.length > 0 ? (
                      eleve.absences.map((absence: { id: string; dateAbsence: Date | string; justifiee: boolean; motif?: string | null }) => (
                        <TableRow key={absence.id}>
                          <TableCell>{new Date(absence.dateAbsence).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell>
                            <Badge className={absence.justifiee ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {absence.justifiee ? "Oui" : "Non"}
                            </Badge>
                          </TableCell>
                          <TableCell>{absence.motif || "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Aucune absence enregistrée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer l'élève"
        description={`Êtes-vous sûr de vouloir supprimer ${eleve.prenom} ${eleve.nom} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteEleve.isPending}
      />

      <EleveForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdate}
        isLoading={updateEleve.isPending}
        eleve={eleve}
      />
    </div>
  );
}
