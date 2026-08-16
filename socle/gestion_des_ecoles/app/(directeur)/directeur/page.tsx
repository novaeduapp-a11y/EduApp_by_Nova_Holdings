"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  GraduationCap,
  TrendingUp,
  CreditCard,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

interface DirecteurDashboardData {
  totalEleves: number;
  totalClasses: number;
  totalProfesseurs: number;
  totalParents: number;
  moyenneGenerale: number | null;
  tauxReussite: number | null;
  paiementsEnAttente: number;
  montantEnAttente: number;
  absencesNonJustifiees: number;
  classesStats: {
    id: string;
    nom: string;
    effectif: number;
    moyenne: number | null;
  }[];
  alertes: {
    type: string;
    message: string;
    count: number;
  }[];
}

export default function DirecteurDashboard() {
  const { data: session } = useSession();
  
  const { data, isLoading } = useQuery({
    queryKey: ["directeur-dashboard"],
    queryFn: async () => {
      const response = await apiGet<DirecteurDashboardData>("/directeur/dashboard");
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 p-8 text-white">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-amber-200 mb-2">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">Direction</span>
          </div>
          <h1 className="text-3xl font-bold">
            Bonjour, {session?.user?.prenom} ! 👋
          </h1>
          <p className="mt-2 text-amber-100 max-w-xl">
            Bienvenue sur votre tableau de bord. Gérez votre établissement, 
            suivez les performances et prenez les meilleures décisions.
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
                  {data?.totalEleves || 0}
                </p>
                <p className="text-sm text-blue-600">Élèves</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {data?.totalClasses || 0}
                </p>
                <p className="text-sm text-green-600">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {data?.totalProfesseurs || 0}
                </p>
                <p className="text-sm text-purple-600">Professeurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {data?.moyenneGenerale ? data.moyenneGenerale.toFixed(2) : "--"}
                </p>
                <p className="text-sm text-orange-600">Moyenne générale</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/directeur/eleves">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-blue-100 rounded-full mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Gérer les Élèves</h3>
            </CardContent>
          </Card>
        </Link>

        <Link href="/directeur/bulletins">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-green-100 rounded-full mb-3">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Valider Bulletins</h3>
            </CardContent>
          </Card>
        </Link>

        <Link href="/directeur/paiements">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-amber-100 rounded-full mb-3">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold">Paiements</h3>
            </CardContent>
          </Card>
        </Link>

        <Link href="/directeur/absences">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-3 bg-red-100 rounded-full mb-3">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold">Absences</h3>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alertes et Stats par classe */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Alertes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.paiementsEnAttente && data.paiementsEnAttente > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  <span className="text-sm">Paiements en attente</span>
                </div>
                <Badge className="bg-amber-500">{data.paiementsEnAttente}</Badge>
              </div>
            )}
            {data?.absencesNonJustifiees && data.absencesNonJustifiees > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-red-600" />
                  <span className="text-sm">Absences non justifiées</span>
                </div>
                <Badge className="bg-red-500">{data.absencesNonJustifiees}</Badge>
              </div>
            )}
            {(!data?.paiementsEnAttente && !data?.absencesNonJustifiees) && (
              <p className="text-center text-muted-foreground py-4">Aucune alerte</p>
            )}
          </CardContent>
        </Card>

        {/* Stats par classe */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Performances par Classe</CardTitle>
            <Link href="/directeur/statistiques">
              <Button variant="outline" size="sm">Voir tout</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.classesStats && data.classesStats.length > 0 ? (
              <div className="space-y-3">
                {data.classesStats.slice(0, 5).map((classe) => (
                  <div
                    key={classe.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{classe.nom}</p>
                      <p className="text-sm text-muted-foreground">{classe.effectif} élèves</p>
                    </div>
                    <div className={`text-lg font-bold ${
                      classe.moyenne && classe.moyenne >= 12 ? "text-green-600" :
                      classe.moyenne && classe.moyenne >= 10 ? "text-blue-600" :
                      "text-red-600"
                    }`}>
                      {classe.moyenne ? classe.moyenne.toFixed(2) : "--"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
