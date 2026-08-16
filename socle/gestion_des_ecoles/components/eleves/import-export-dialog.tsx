"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    imported: number;
    errors: { ligne: number; erreur: string }[];
  } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/eleves");
      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eleves_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Export réussi", description: "Le fichier Excel a été téléchargé" });
    } catch (error) {
      console.error("Erreur export:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'exporter les données" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/eleves", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Erreur lors de l'import");
      }

      setImportResult(result.data);
      queryClient.invalidateQueries({ queryKey: ["eleves"] });

      if (result.data.errors.length === 0) {
        toast({ title: "Import réussi", description: `${result.data.imported} élève(s) importé(s)` });
      } else {
        toast({
          variant: "destructive",
          title: "Import partiel",
          description: `${result.data.imported} importé(s), ${result.data.errors.length} erreur(s)`,
        });
      }
    } catch (error) {
      console.error("Erreur import:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'importer le fichier" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadTemplate = () => {
    // Créer un template Excel vide avec les en-têtes
    const headers = [
      "Nom", "Prénom", "Date de naissance", "Lieu de naissance", "Sexe", "Classe",
      "Nom du père", "Téléphone père", "Nom de la mère", "Téléphone mère",
      "Nom tuteur", "Téléphone tuteur", "Email parent", "Adresse"
    ];
    
    const csvContent = headers.join(",") + "\n" + 
      "Diallo,Moussa,15/03/2015,Dakar,M,CI-A,Mamadou Diallo,+221771234567,Fatou Diallo,+221781234567,,,parent@email.com,Dakar";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_import_eleves.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Template téléchargé", description: "Remplissez le fichier et importez-le" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import / Export des élèves</DialogTitle>
          <DialogDescription>
            Importez ou exportez les données des élèves au format Excel
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Exporter tous les élèves</p>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez un fichier Excel contenant toutes les informations des élèves
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le fichier Excel
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-start gap-3">
                <Upload className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Importer des élèves</p>
                  <p className="text-sm text-muted-foreground">
                    Importez un fichier Excel ou CSV avec les données des élèves
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file">
                <Button asChild disabled={isImporting} className="w-full cursor-pointer">
                  <span>
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Sélectionner un fichier
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Télécharger le template
              </Button>
            </div>

            {/* Résultat de l'import */}
            {importResult && (
              <div className={`p-4 rounded-lg ${importResult.errors.length === 0 ? "bg-green-50" : "bg-yellow-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.errors.length === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {importResult.imported} / {importResult.total} élève(s) importé(s)
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium text-red-600 mb-1">Erreurs :</p>
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs text-red-600">
                        Ligne {err.ligne}: {err.erreur}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... et {importResult.errors.length - 5} autres erreurs
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
