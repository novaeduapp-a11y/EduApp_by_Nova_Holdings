"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

interface NotesData {
  moyennesGenerales: Array<{
    moyenne: number;
    rang: number;
    mention: string;
    periode: string;
  }>;
}

interface AbsencesData {
  stats: {
    total: number;
    justifiees: number;
    nonJustifiees: number;
  };
}

interface Bulletin {
  id: string;
  periode: string;
  moyenne: number;
  rang: number;
}

export default function EnfantProfilPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;

  const { data: notesData, isLoading: loadingNotes } = useQuery({
    queryKey: ["parent-enfant-notes", eleveId],
    queryFn: async () => {
      const response = await apiGet<NotesData>(`/parent/enfants/${eleveId}/notes`);
      return response.data;
    },
  });

  const { data: absencesData, isLoading: loadingAbsences } = useQuery({
    queryKey: ["parent-enfant-absences", eleveId],
    queryFn: async () => {
      const response = await apiGet<AbsencesData>(`/parent/enfants/${eleveId}/absences`);
      return response.data;
    },
  });

  const { data: bulletinsData, isLoading: loadingBulletins } = useQuery({
    queryKey: ["parent-enfant-bulletins", eleveId],
    queryFn: async () => {
      const response = await apiGet<Bulletin[]>(`/parent/enfants/${eleveId}/bulletins`);
      return response.data;
    },
  });

  const isLoading = loadingNotes || loadingAbsences || loadingBulletins;

  const derniereMoyenne = notesData?.moyennesGenerales?.[0];
  const absencesStats = absencesData?.stats;
  const bulletins = bulletinsData || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/parent">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Profil de l&apos;élève</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de la scolarité</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Dernière Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            {derniereMoyenne ? (
              <>
                <div className="text-3xl font-bold">{Number(derniereMoyenne.moyenne).toFixed(2)}/20</div>
                <p className="text-sm text-muted-foreground">
                  Rang: {derniereMoyenne.rang}e - {derniereMoyenne.mention}
                </p>
                <Badge variant="outline" className="mt-2">{derniereMoyenne.periode}</Badge>
              </>
            ) : (
              <p className="text-muted-foreground">Aucune moyenne disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {absencesStats ? (
              <>
                <div className="text-3xl font-bold">{absencesStats.total}</div>
                <p className="text-sm">
                  <span className="text-green-600">{absencesStats.justifiees} justifiées</span>
                  {" · "}
                  <span className="text-red-600">{absencesStats.nonJustifiees} non justifiées</span>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Aucune absence</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bulletins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bulletins.length}</div>
            <p className="text-sm text-muted-foreground">bulletins disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/parent/enfant/${eleveId}/notes`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-blue-100 rounded-full mb-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium">Voir les Notes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consultez toutes les notes et moyennes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/parent/enfant/${eleveId}/absences`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-orange-100 rounded-full mb-3">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-medium">Voir les Absences</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Historique des absences et retards
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/parent/enfant/${eleveId}/bulletins`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-green-100 rounded-full mb-3">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium">Télécharger Bulletins</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Bulletins PDF avec QR Code
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
