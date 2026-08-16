"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  User, 
  BookOpen, 
  Calendar, 
  FileText, 
  ChevronRight, 
  TrendingUp,
  AlertCircle,
  Bell,
  CreditCard,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { QueryState } from "@/components/shared/query-state";

interface Enfant {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  photo: string | null;
  classe: string;
  cycle: string | null;
  relation: string;
}

export default function ParentDashboard() {
  const { data: session } = useSession();
  
  const { data: enfantsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["parent-enfants"],
    queryFn: async () => {
      const response = await apiGet<Enfant[]>("/parent/enfants");
      return response.data;
    },
  });

  const enfants = enfantsData || [];

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      loadingFallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      }
    >
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-200 mb-2">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">Espace Parent</span>
          </div>
          <h1 className="text-3xl font-bold">
            Bonjour, {session?.user?.prenom} ! 👋
          </h1>
          <p className="mt-2 text-blue-100 max-w-xl">
            Bienvenue sur votre espace dédié. Suivez la scolarité de vos enfants, 
            consultez leurs notes et restez informé de leur progression.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/parent/messages">
              <Button variant="secondary" size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
                2 nouveaux messages
              </Button>
            </Link>
            <Link href="/parent/paiements">
              <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <CreditCard className="h-4 w-4" />
                Voir les paiements
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{enfants.length}</p>
                <p className="text-sm text-green-600">Enfant(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">--</p>
                <p className="text-sm text-blue-600">Moyenne générale</p>
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
                <p className="text-2xl font-bold text-orange-700">0</p>
                <p className="text-sm text-orange-600">Absences</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">0</p>
                <p className="text-sm text-purple-600">Bulletins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Enfants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Mes Enfants</h2>
          <Badge variant="outline">{enfants.length} inscrit(s)</Badge>
        </div>

        {enfants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun enfant associé</h3>
              <p className="text-muted-foreground mt-1">
                Contactez l&apos;administration de l&apos;école pour associer vos enfants à votre compte.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enfants.map((enfant) => (
              <Card key={enfant.id} className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-blue-100">
                      <AvatarImage src={enfant.photo || undefined} />
                      <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        {enfant.prenom[0]}{enfant.nom[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{enfant.prenom} {enfant.nom}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{enfant.matricule}</span>
                      </CardDescription>
                      <Badge className="mt-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {enfant.classe}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Link href={`/parent/enfant/${enfant.id}/notes`}>
                      <Button variant="outline" className="w-full h-20 flex-col gap-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                        <BookOpen className="h-5 w-5" />
                        <span className="text-xs font-medium">Notes</span>
                      </Button>
                    </Link>
                    <Link href={`/parent/enfant/${enfant.id}/absences`}>
                      <Button variant="outline" className="w-full h-20 flex-col gap-1 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors">
                        <Calendar className="h-5 w-5" />
                        <span className="text-xs font-medium">Absences</span>
                      </Button>
                    </Link>
                    <Link href={`/parent/enfant/${enfant.id}/bulletins`}>
                      <Button variant="outline" className="w-full h-20 flex-col gap-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors">
                        <FileText className="h-5 w-5" />
                        <span className="text-xs font-medium">Bulletins</span>
                      </Button>
                    </Link>
                  </div>
                  <Link href={`/parent/enfant/${enfant.id}`}>
                    <Button variant="ghost" className="w-full justify-between hover:bg-gray-100">
                      <span>Voir le profil complet</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Alertes et Conseils */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900">Rappel important</h4>
                <p className="text-sm text-amber-700">
                  La réunion parents-professeurs aura lieu le samedi 15 février 2026 à 9h00.
                  Votre présence est vivement souhaitée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Conseil</h4>
                <p className="text-sm text-blue-700">
                  Consultez régulièrement les notes et absences de vos enfants pour un meilleur suivi scolaire.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </QueryState>
  );
}
