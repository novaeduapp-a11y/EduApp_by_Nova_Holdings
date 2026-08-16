"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulletinPDF, type BulletinData } from "@/lib/pdf/bulletin-template";
import { useToast } from "@/hooks/use-toast";

interface BulletinPDFGeneratorProps {
  eleveId: string;
  periodeId: string;
  eleveName?: string;
}

export function BulletinPDFGenerator({ eleveId, periodeId, eleveName }: BulletinPDFGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Appeler l'API pour générer les données du bulletin
      const response = await fetch("/api/bulletins/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eleveId, periodeId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Erreur lors de la génération");
      }

      const bulletinData: BulletinData = result.data.bulletinData;

      // Générer le PDF côté client
      const blob = await pdf(<BulletinPDF data={bulletinData} />).toBlob();

      // Télécharger le PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bulletin_${bulletinData.eleve.matricule}_${bulletinData.periode.nom.replace(/\s/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Bulletin généré",
        description: `Le bulletin de ${eleveName || bulletinData.eleve.prenom} a été téléchargé`,
      });
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le bulletin",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isGenerating} size="sm">
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Télécharger PDF
        </>
      )}
    </Button>
  );
}

interface BulletinPreviewProps {
  data: BulletinData;
}

export function BulletinPreview({ data }: BulletinPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await pdf(<BulletinPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bulletin_${data.eleve.matricule}_${data.periode.nom.replace(/\s/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Bulletin téléchargé",
        description: `Le bulletin de ${data.eleve.prenom} ${data.eleve.nom} a été téléchargé`,
      });
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le bulletin",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      {/* Preview Card */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{data.eleve.prenom} {data.eleve.nom}</p>
            <p className="text-sm text-muted-foreground">
              {data.eleve.classe} - {data.periode.nom}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{data.moyenneGenerale.toFixed(2)}/20</p>
          <p className="text-sm text-muted-foreground">Rang: {data.rang}e</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">Matières</p>
          <p className="text-xl font-bold">{data.notes.length}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">Moyenne</p>
          <p className="text-xl font-bold text-blue-600">{data.moyenneGenerale.toFixed(2)}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">Mention</p>
          <p className="text-xl font-bold text-green-600">{data.mention}</p>
        </div>
      </div>

      {/* Download Button */}
      <Button onClick={handleDownload} disabled={isDownloading} className="w-full">
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Téléchargement...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le bulletin PDF
          </>
        )}
      </Button>
    </div>
  );
}
