"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  TrendingUp,
  GraduationCap,
  Clock,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { QueryState } from "@/components/shared/query-state";

interface EleveData {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  classe: string;
  cycle: string | null;
  moyenneGenerale: number | null;
  rang: number | null;
  totalAbsences: number;
  absencesNonJustifiees: number;
  totalBulletins: number;
  dernieresNotes: {
    id: string;
    matiere: string;
    note: number;
    noteMax: number;
    date: string;
  }[];
}

export default function EleveDashboard() {
  const { data: session } = useSession();
  
  const { data: eleveData, isLoading, isError, refetch } = useQuery({
    queryKey: ["eleve-dashboard"],
    queryFn: async () => {
      const response = await apiGet<EleveData>("/eleve/dashboard");
      return response.data;
    },
  });

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      loadingFallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      }
    >
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 p-8 text-white">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-green-200 mb-2">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">Espace Élève</span>
          </div>
          <h1 className="text-3xl font-bold">
            Bonjour, {session?.user?.prenom} ! 👋
          </h1>
          <p className="mt-2 text-green-100 max-w-xl">
            Bienvenue sur ton espace personnel. Consulte tes notes, 
            tes absences et suis ta progression scolaire.
          </p>
          {eleveData && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Badge className="bg-white/20 text-white border-0 px-3 py-1">
                {eleveData.classe}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 px-3 py-1">
                Matricule: {eleveData.matricule}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {eleveData?.moyenneGenerale ? `${eleveData.moyenneGenerale.toFixed(2)}` : "--"}
                </p>
                <p className="text-sm text-blue-600">Moyenne générale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {eleveData?.rang ? `${eleveData.rang}e` : "--"}
                </p>
                <p className="text-sm text-purple-600">Rang en classe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {eleveData?.totalAbsences || 0}
                </p>
                <p className="text-sm text-orange-600">Absences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {eleveData?.totalBulletins || 0}
                </p>
                <p className="text-sm text-green-600">Bulletins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/eleve/notes">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 bg-blue-100 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Mes Notes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consulte toutes tes notes et moyennes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/eleve/absences">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 bg-orange-100 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg">Mes Absences</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Voir l&apos;historique de tes absences
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/eleve/bulletins">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 bg-green-100 rounded-full mb-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Mes Bulletins</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Télécharge tes bulletins scolaires
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Dernières Notes */}
      {eleveData?.dernieresNotes && eleveData.dernieresNotes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Dernières Notes
            </CardTitle>
            <Link href="/eleve/notes">
              <Button variant="outline" size="sm">Voir tout</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eleveData.dernieresNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{note.matiere}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${
                    note.note >= note.noteMax * 0.8 ? "text-green-600" :
                    note.note >= note.noteMax * 0.5 ? "text-blue-600" :
                    "text-red-600"
                  }`}>
                    {note.note}/{note.noteMax}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </QueryState>
  );
}
