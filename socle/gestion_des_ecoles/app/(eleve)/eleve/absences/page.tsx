"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";

interface Absence {
  id: string;
  date: string;
  periode: string;
  duree: number | null;
  matiere: string | null;
  justifiee: boolean;
  motif: string | null;
}

interface AbsencesData {
  absences: Absence[];
  stats: {
    total: number;
    justifiees: number;
    nonJustifiees: number;
  };
}

export default function EleveAbsencesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["eleve-absences"],
    queryFn: async () => {
      const response = await apiGet<AbsencesData>("/eleve/absences");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { absences = [], stats } = data || { absences: [], stats: { total: 0, justifiees: 0, nonJustifiees: 0 } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/eleve">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Mes Absences
          </h1>
          <p className="text-muted-foreground">Historique de tes absences</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total absences</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-700">{stats?.justifiees || 0}</p>
              <p className="text-sm text-green-600">Justifiées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-700">{stats?.nonJustifiees || 0}</p>
              <p className="text-sm text-red-600">Non justifiées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des absences */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune absence enregistrée</p>
              <p className="text-sm text-muted-foreground mt-1">Continue comme ça ! 🎉</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.map((absence) => (
                  <TableRow key={absence.id}>
                    <TableCell className="font-medium">
                      {new Date(absence.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>{absence.periode}</TableCell>
                    <TableCell>{absence.matiere || "-"}</TableCell>
                    <TableCell>
                      <Badge className={absence.justifiee ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {absence.justifiee ? "Justifiée" : "Non justifiée"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {absence.motif || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
