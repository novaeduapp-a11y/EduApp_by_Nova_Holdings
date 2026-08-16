"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BulletinData {
  ecole: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
  };
  eleve: {
    nom: string;
    prenom: string;
    matricule: string;
    dateNaissance: string;
    classe: string;
    effectif: number;
  };
  periode: {
    nom: string;
    anneeScolaire: string;
  };
  notes: {
    matiere: string;
    note: number;
    noteSur: number;
    coefficient: number;
    moyenne: number;
    appreciation: string;
  }[];
  moyenneGenerale: number;
  rang: number;
  mention: string;
  appreciationGenerale: string;
  qrCodeUrl?: string;
  dateGeneration: string;
}

interface DownloadBulletinButtonProps {
  eleveId: string;
  periodeId: string;
  eleveName: string;
  variant?: "ghost" | "outline" | "default" | "dropdown";
  size?: "sm" | "default" | "lg" | "icon";
}

export function DownloadBulletinButton({
  eleveId,
  periodeId,
  eleveName,
  variant = "ghost",
  size = "sm",
}: DownloadBulletinButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // Appeler l'API pour générer les données du bulletin
      const response = await fetch("/api/bulletins/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eleveId, periodeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erreur lors de la génération");
      }

      const result = await response.json();
      const bulletinData: BulletinData = result.data.bulletinData;

      // Vérifier que les données sont complètes
      if (!bulletinData.notes || bulletinData.notes.length === 0) {
        toast({
          variant: "destructive",
          title: "Aucune note",
          description: "Cet élève n'a pas de notes pour cette période.",
        });
        return;
      }

      // Import dynamique de react-pdf pour éviter les erreurs SSR
      const { pdf } = await import("@react-pdf/renderer");
      const { BulletinPDF } = await import("@/lib/pdf/bulletin-template");

      // Générer le PDF
      const blob = await pdf(<BulletinPDF data={bulletinData} />).toBlob();

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bulletin_${bulletinData.eleve.prenom}_${bulletinData.eleve.nom}_${bulletinData.periode.nom.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement réussi",
        description: `Bulletin de ${eleveName} téléchargé.`,
      });
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de télécharger le bulletin",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Variante dropdown - affiche juste le texte et l'icône
  if (variant === "dropdown") {
    return (
      <span onClick={handleDownload} className="flex items-center w-full cursor-pointer">
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Télécharger
      </span>
    );
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
