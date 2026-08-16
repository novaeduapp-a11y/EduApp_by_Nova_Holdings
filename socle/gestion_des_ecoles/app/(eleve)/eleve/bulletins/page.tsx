"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

interface Bulletin {
  id: string;
  periode: string;
  moyenne: number | null;
  rang: number | null;
  mention: string | null;
  fichierPdf: string | null;
  createdAt: string;
}

export default function EleveBulletinsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["eleve-bulletins"],
    queryFn: async () => {
      const response = await apiGet<Bulletin[]>("/eleve/bulletins");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const bulletins = data || [];

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
            <FileText className="h-6 w-6" />
            Mes Bulletins
          </h1>
          <p className="text-muted-foreground">Télécharge tes bulletins scolaires</p>
        </div>
      </div>

      {/* Liste des bulletins */}
      {bulletins.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun bulletin disponible</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les bulletins seront disponibles à la fin de chaque période
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bulletins.map((bulletin) => (
            <Card key={bulletin.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{bulletin.periode}</span>
                  {bulletin.mention && (
                    <Badge className={
                      bulletin.mention === "Très Bien" ? "bg-green-500" :
                      bulletin.mention === "Bien" ? "bg-blue-500" :
                      bulletin.mention === "Assez Bien" ? "bg-yellow-500" :
                      "bg-gray-500"
                    }>
                      {bulletin.mention}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {bulletin.moyenne ? bulletin.moyenne.toFixed(2) : "--"}
                    </p>
                    <p className="text-xs text-muted-foreground">Moyenne</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {bulletin.rang ? `${bulletin.rang}e` : "--"}
                    </p>
                    <p className="text-xs text-muted-foreground">Rang</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Généré le {new Date(bulletin.createdAt).toLocaleDateString("fr-FR")}
                </p>

                {bulletin.fichierPdf ? (
                  <Button className="w-full" asChild>
                    <a href={bulletin.fichierPdf} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le PDF
                    </a>
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF non disponible
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
