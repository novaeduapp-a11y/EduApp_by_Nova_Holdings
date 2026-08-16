"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading-spinner";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BulletinDetail {
  id: string;
  eleveId: string;
  periodeId: string;
  tokenQr: string;
  createdAt: string;
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    dateNaissance: string;
    classe: {
      id: string;
      nom: string;
      niveau: string;
    };
  };
  periode: {
    id: string;
    nom: string;
    anneeScolaire: string;
  };
  user?: {
    nom: string;
    prenom: string;
  };
  moyenneGenerale?: {
    moyenne: number;
    rang: number | null;
    mention: string | null;
  } | null;
}

const mentionColors: Record<string, string> = {
  "Très Bien": "bg-green-100 text-green-700",
  "Bien": "bg-blue-100 text-blue-700",
  "Assez Bien": "bg-cyan-100 text-cyan-700",
  "Passable": "bg-yellow-100 text-yellow-700",
  "Insuffisant": "bg-red-100 text-red-700",
};

export default function BulletinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const bulletinId = params.id as string;

  const { data: bulletin, isLoading } = useQuery({
    queryKey: ["bulletin", bulletinId],
    queryFn: async () => {
      const response = await apiGet<BulletinDetail>(`/bulletins/${bulletinId}`);
      return response.data;
    },
    enabled: !!bulletinId,
  });

  const handleDownload = async () => {
    if (!bulletin) return;
    setIsDownloading(true);
    try {
      const response = await fetch("/api/bulletins/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eleveId: bulletin.eleveId, periodeId: bulletin.periodeId }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération");
      }

      const result = await response.json();
      const bulletinData = result.data.bulletinData;

      const { pdf } = await import("@react-pdf/renderer");
      const { BulletinPDF } = await import("@/lib/pdf/bulletin-template");

      const blob = await pdf(<BulletinPDF data={bulletinData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bulletin_${bulletin.eleve.prenom}_${bulletin.eleve.nom}_${bulletin.periode.nom.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Succès", description: "Bulletin téléchargé" });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de télécharger le bulletin" });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return <PageLoading />;
  if (!bulletin) return <div className="text-center py-10">Bulletin non trouvé</div>;

  const moyenne = bulletin.moyenneGenerale;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bulletin de ${bulletin.eleve.prenom} ${bulletin.eleve.nom}`}
        description={`${bulletin.periode.nom} - ${bulletin.periode.anneeScolaire}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Retour
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Télécharger PDF
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Élève</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-bold">{bulletin.eleve.prenom} {bulletin.eleve.nom}</p>
              <p className="text-sm text-muted-foreground">Matricule: {bulletin.eleve.matricule}</p>
              <p className="text-sm text-muted-foreground">
                Né(e) le {new Date(bulletin.eleve.dateNaissance).toLocaleDateString("fr-FR")}
              </p>
              <Badge variant="outline">{bulletin.eleve.classe.nom}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne Générale</p>
                <p className="text-3xl font-bold text-blue-600">
                  {moyenne?.moyenne ? moyenne.moyenne.toFixed(2) : "-"}/20
                </p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rang</p>
                  <p className="text-xl font-bold">{moyenne?.rang ? `${moyenne.rang}e` : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mention</p>
                  {moyenne?.mention ? (
                    <Badge className={mentionColors[moyenne.mention] || "bg-gray-100 text-gray-700"}>
                      {moyenne.mention}
                    </Badge>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Période</p>
                <p className="font-medium">{bulletin.periode.nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Année scolaire</p>
                <p className="font-medium">{bulletin.periode.anneeScolaire}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Généré le</p>
                <p className="font-medium">{new Date(bulletin.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              {bulletin.user && (
                <div>
                  <p className="text-sm text-muted-foreground">Par</p>
                  <p className="font-medium">{bulletin.user.prenom} {bulletin.user.nom}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Code de vérification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="bg-gray-100 px-4 py-2 rounded text-lg font-mono">{bulletin.tokenQr}</code>
            <p className="text-sm text-muted-foreground">
              Ce code permet de vérifier l&apos;authenticité du bulletin
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
