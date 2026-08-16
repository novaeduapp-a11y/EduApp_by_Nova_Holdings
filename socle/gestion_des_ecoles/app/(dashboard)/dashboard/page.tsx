"use client";

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  TrendingUp,
  AlertCircle,
  Calendar,
  Award,
  Loader2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { QueryState } from "@/components/shared/query-state";
import { PageLoading } from "@/components/shared/loading-spinner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: dashboardData, isLoading, isError, refetch } = useDashboard();

  const stats = [
    {
      title: "Total Élèves",
      value: dashboardData?.stats.totalEleves || 0,
      description: "Élèves inscrits",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Classes",
      value: dashboardData?.stats.totalClasses || 0,
      description: "Classes actives",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Matières",
      value: dashboardData?.stats.totalMatieres || 0,
      description: "Matières enseignées",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Évaluations",
      value: dashboardData?.stats.totalEvaluations || 0,
      description: "Évaluations créées",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const recentActivities = [
    ...(dashboardData?.activitesRecentes.inscriptions || []).map((a) => ({
      action: "Inscription",
      description: a.description,
      time: new Date(a.date).toLocaleDateString("fr-FR"),
    })),
    ...(dashboardData?.activitesRecentes.absences || []).map((a) => ({
      action: "Absence",
      description: a.description,
      time: new Date(a.date).toLocaleDateString("fr-FR"),
    })),
  ].slice(0, 5);

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      loadingFallback={<PageLoading />}
    >
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue ${session?.user?.prenom}, voici un aperçu de votre établissement`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activités récentes
            </CardTitle>
            <CardDescription>
              Les dernières actions effectuées sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Alertes
            </CardTitle>
            <CardDescription>Points d&apos;attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Période active</p>
                  <p className="text-xs text-muted-foreground">
                    1er Trimestre 2025-2026
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Absences non justifiées</p>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.stats.absencesNonJustifiees || 0} absence(s) à traiter
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Meilleure moyenne</p>
                  <p className="text-xs text-muted-foreground">
                    CM2-A : 14.5/20
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats by Cycle */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par cycle</CardTitle>
          <CardDescription>
            Nombre d&apos;élèves par cycle scolaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(dashboardData?.elevesParCycle || []).map((cycle) => (
                <div
                  key={cycle.cycle}
                  className="text-center p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-2xl font-bold text-blue-600">{cycle.count}</p>
                  <p className="text-sm text-muted-foreground">{cycle.cycle}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Taux de réussite par classe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Taux de réussite par classe
          </CardTitle>
          <CardDescription>
            Pourcentage d&apos;élèves avec une moyenne ≥ 10/20
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Taux global */}
              <div className="p-4 bg-blue-50 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Taux de réussite global</span>
                  <Badge variant={
                    (dashboardData?.stats.tauxReussiteGlobal || 0) >= 80 ? "default" :
                    (dashboardData?.stats.tauxReussiteGlobal || 0) >= 50 ? "secondary" :
                    "destructive"
                  }>
                    {dashboardData?.stats.tauxReussiteGlobal || 0}%
                  </Badge>
                </div>
                <Progress value={dashboardData?.stats.tauxReussiteGlobal || 0} className="h-3" />
              </div>

              {/* Par classe */}
              <div className="grid gap-3">
                {(dashboardData?.tauxReussiteParClasse || []).map((classe) => (
                  <div key={classe.classeId} className="flex items-center gap-4">
                    <div className="w-24 font-medium text-sm">{classe.classe}</div>
                    <div className="flex-1">
                      <Progress 
                        value={classe.tauxReussite} 
                        className={`h-2 ${
                          classe.tauxReussite >= 80 ? "[&>div]:bg-green-500" :
                          classe.tauxReussite >= 50 ? "[&>div]:bg-yellow-500" :
                          "[&>div]:bg-red-500"
                        }`}
                      />
                    </div>
                    <div className="w-16 text-right text-sm">
                      <span className={
                        classe.tauxReussite >= 80 ? "text-green-600 font-bold" :
                        classe.tauxReussite >= 50 ? "text-yellow-600" :
                        "text-red-600"
                      }>
                        {classe.tauxReussite}%
                      </span>
                    </div>
                    <div className="w-20 text-right text-xs text-muted-foreground">
                      {classe.elevesReussis}/{classe.elevesEvalues}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Élèves en difficulté par classe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            📉 Élèves en difficulté par classe
          </CardTitle>
          <CardDescription>
            Nombre d&apos;élèves avec une moyenne inférieure à 10/20
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (dashboardData?.elevesEnDifficulteParClasse || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Aucun élève en difficulté ! 🎉</p>
              <p className="text-sm">Tous les élèves ont une moyenne ≥ 10/20</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboardData?.elevesEnDifficulteParClasse || []).map((classe) => (
                <div 
                  key={classe.classeId} 
                  className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">{classe.classe}</p>
                      <p className="text-sm text-red-700">
                        {classe.enDifficulte} élève(s) sur {classe.effectif}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      {classe.pourcentage}%
                    </Badge>
                    <p className="text-xs text-red-600 mt-1">en difficulté</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des élèves en difficulté */}
      <Card id="eleves-difficulte">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Liste des élèves à suivre
          </CardTitle>
          <CardDescription>
            Élèves nécessitant un accompagnement particulier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (dashboardData?.elevesEnDifficulte || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Aucun élève en difficulté ! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboardData?.elevesEnDifficulte || []).map((eleve) => (
                <Link 
                  key={eleve.id} 
                  href={`/eleves/${eleve.id}`}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="bg-red-500">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      À suivre
                    </Badge>
                    <div>
                      <p className="font-medium">{eleve.prenom} {eleve.nom}</p>
                      <p className="text-sm text-muted-foreground">{eleve.classe}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">{eleve.moyenne}/20</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{eleve.periode}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </QueryState>
  );
}
