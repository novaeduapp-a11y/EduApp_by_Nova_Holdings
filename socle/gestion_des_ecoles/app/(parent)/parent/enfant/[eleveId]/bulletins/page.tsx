"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Download, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

interface Bulletin {
  id: string;
  periode: string;
  periodeNumero: number;
  moyenne: number;
  rang: number;
  mention: string;
  appreciationGenerale: string | null;
  qrCode: string | null;
  dateGeneration: string;
  classe: string;
}

export default function EnfantBulletinsPage() {
  const params = useParams();
  const eleveId = params.eleveId as string;

  const { data: bulletins, isLoading } = useQuery({
    queryKey: ["parent-enfant-bulletins", eleveId],
    queryFn: async () => {
      const response = await apiGet<Bulletin[]>(`/parent/enfants/${eleveId}/bulletins`);
      return response.data;
    },
  });

  const handleDownload = (bulletinId: string) => {
    window.open(`/bulletins/${bulletinId}`, "_blank");
  };

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
            <FileText className="h-6 w-6" />
            Bulletins Scolaires
          </h1>
          <p className="text-muted-foreground">Téléchargez les bulletins de votre enfant</p>
        </div>
      </div>

      {/* Liste des bulletins */}
      {!bulletins || bulletins.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucun bulletin disponible</h3>
            <p className="text-muted-foreground mt-1">
              Les bulletins seront disponibles après la fin de chaque période.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bulletins.map((bulletin) => (
            <Card key={bulletin.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{bulletin.periode}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Classe: {bulletin.classe}
                    </p>
                  </div>
                  {bulletin.qrCode && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <QrCode className="h-3 w-3" />
                      Vérifié
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {Number(bulletin.moyenne).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Moyenne</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{bulletin.rang}e</p>
                    <p className="text-xs text-muted-foreground">Rang</p>
                  </div>
                  <div>
                    <Badge variant={
                      bulletin.mention === "Très Bien" ? "default" :
                      bulletin.mention === "Bien" ? "secondary" :
                      "outline"
                    }>
                      {bulletin.mention}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Mention</p>
                  </div>
                </div>

                {bulletin.appreciationGenerale && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Appréciation générale</p>
                    <p className="text-sm text-muted-foreground">
                      {bulletin.appreciationGenerale}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Généré le {new Date(bulletin.dateGeneration).toLocaleDateString("fr-FR")}
                  </p>
                  <Button onClick={() => handleDownload(bulletin.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info QR Code */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <QrCode className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">À propos du QR Code</p>
              <p className="text-sm text-blue-700 mt-1">
                Chaque bulletin contient un QR Code unique permettant de vérifier son authenticité.
                Scannez-le pour confirmer que le bulletin n&apos;a pas été falsifié.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
