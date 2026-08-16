"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Check, X } from "lucide-react";
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
  heures: number;
  motif: string | null;
  justifiee: boolean;
  matiere: string | null;
}

interface AbsencesData {
  absences: Absence[];
  stats: {
    total: number;
    justifiees: number;
    nonJustifiees: number;
  };
}

export default function EnfantAbsencesPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;

  const { data, isLoading } = useQuery({
    queryKey: ["parent-enfant-absences", eleveId],
    queryFn: async () => {
      const response = await apiGet<AbsencesData>(`/parent/enfants/${eleveId}/absences`);
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

  const { absences = [], stats } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/parent/enfant/${eleveId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Absences
          </h1>
          <p className="text-muted-foreground">Historique des absences de votre enfant</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Absences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Justifiées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.justifiees}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                Non Justifiées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.nonJustifiees}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des absences */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Absences</CardTitle>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune absence enregistrée</p>
              <p className="text-sm text-green-600 mt-2">Excellent ! Continuez ainsi 👏</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.map((absence) => (
                  <TableRow key={absence.id}>
                    <TableCell className="font-medium">
                      {new Date(absence.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{absence.periode}</Badge>
                    </TableCell>
                    <TableCell>{absence.heures}h</TableCell>
                    <TableCell>{absence.matiere || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {absence.motif || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {absence.justifiee ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <Check className="h-3 w-3 mr-1" />
                          Justifiée
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Non justifiée
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      {stats && stats.nonJustifiees > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="py-4">
            <p className="text-sm text-orange-700">
              <strong>Rappel :</strong> Veuillez fournir un justificatif à l&apos;administration 
              pour les absences non justifiées.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
