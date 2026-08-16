"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

interface ClasseProf {
  id: string;
  nom: string;
  niveau: string;
  effectif: number;
  matiere: string;
  matiereId: string;
}

export default function ProfesseurClassesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["professeur-classes"],
    queryFn: async () => {
      const response = await apiGet<ClasseProf[]>("/professeur/classes");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const classes = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/professeur">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Mes Classes
          </h1>
          <p className="text-muted-foreground">Classes où vous enseignez</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune classe assignée</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contactez l&apos;administration pour être assigné à des classes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classe) => (
            <Card key={`${classe.id}-${classe.matiereId}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{classe.nom}</span>
                  <Badge variant="outline">{classe.niveau}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{classe.matiere}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{classe.effectif} élèves</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/professeur/notes?classeId=${classe.id}&matiereId=${classe.matiereId}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Saisir notes
                    </Button>
                  </Link>
                  <Link href={`/professeur/classes/${classe.id}`} className="flex-1">
                    <Button className="w-full" size="sm">
                      Voir élèves
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
