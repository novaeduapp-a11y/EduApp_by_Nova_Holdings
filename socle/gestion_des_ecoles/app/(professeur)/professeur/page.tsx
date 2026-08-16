"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  ClipboardList,
  Calendar,
  GraduationCap,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

interface ProfesseurDashboardData {
  totalClasses: number;
  totalEleves: number;
  totalEvaluations: number;
  evaluationsEnAttente: number;
  classes: {
    id: string;
    nom: string;
    effectif: number;
    matiere: string;
  }[];
  prochainesEvaluations: {
    id: string;
    titre: string;
    classe: string;
    matiere: string;
    date: string;
  }[];
}

export default function ProfesseurDashboard() {
  const { data: session } = useSession();
  
  const { data, isLoading } = useQuery({
    queryKey: ["professeur-dashboard"],
    queryFn: async () => {
      const response = await apiGet<ProfesseurDashboardData>("/professeur/dashboard");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-200 mb-2">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">Espace Professeur</span>
          </div>
          <h1 className="text-3xl font-bold">
            Bonjour, {session?.user?.prenom} ! 👋
          </h1>
          <p className="mt-2 text-indigo-100 max-w-xl">
            Gérez vos classes, saisissez les notes et suivez la progression de vos élèves.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {data?.totalClasses || 0}
                </p>
                <p className="text-sm text-blue-600">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {data?.totalEleves || 0}
                </p>
                <p className="text-sm text-green-600">Élèves</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {data?.totalEvaluations || 0}
                </p>
                <p className="text-sm text-purple-600">Évaluations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {data?.evaluationsEnAttente || 0}
                </p>
                <p className="text-sm text-orange-600">Notes à saisir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/professeur/notes">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 bg-indigo-100 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg">Saisir des Notes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Entrez les notes de vos évaluations
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/professeur/classes">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 bg-purple-100 rounded-full mb-4">
                <ClipboardList className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">Mes classes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Uniquement les classes qui vous sont affectées
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/professeur/appel">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 bg-orange-100 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg">Feuille d’appel</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Présent, absent ou retard
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mes Classes */}
      {data?.classes && data.classes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mes Classes
            </CardTitle>
            <Link href="/professeur/classes">
              <Button variant="outline" size="sm">Voir tout</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.classes.slice(0, 6).map((classe) => (
                <Link key={classe.id} href={`/professeur/classes/${classe.id}`}>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{classe.nom}</h4>
                      <Badge variant="outline">{classe.effectif} élèves</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{classe.matiere}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prochaines Évaluations */}
      {data?.prochainesEvaluations && data.prochainesEvaluations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prochaines Évaluations
            </CardTitle>
            <Link href="/professeur/notes">
              <Button variant="outline" size="sm">Voir tout</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.prochainesEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{evaluation.titre}</p>
                    <p className="text-sm text-muted-foreground">
                      {evaluation.classe} - {evaluation.matiere}
                    </p>
                  </div>
                  <Badge>
                    {new Date(evaluation.date).toLocaleDateString("fr-FR")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
