"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Home, Loader2, QrCode, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface VerificationResult {
  valid: boolean;
  message: string;
  bulletin?: {
    id: string;
    eleve: {
      nom: string;
      prenom: string;
      matricule: string;
      classe: string;
    };
    periode: string;
    anneeScolaire: string;
    moyenne: number | null;
    rang: number | null;
    mention: string | null;
    dateGeneration: string;
    generePar: string | null;
  };
}

const mentionColors: Record<string, string> = {
  "Très Bien": "bg-green-100 text-green-700",
  Bien: "bg-blue-100 text-blue-700",
  "Assez Bien": "bg-cyan-100 text-cyan-700",
  Passable: "bg-yellow-100 text-yellow-700",
  Insuffisant: "bg-red-100 text-red-700",
};

export default function VerifierBulletinPage() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async (codeToVerify = code) => {
    const normalizedCode = codeToVerify.trim();

    if (!normalizedCode) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez entrer un code de vérification" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/bulletins/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Erreur lors de la vérification");
      }

      setResult(data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de vérifier le bulletin",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const codeFromUrl = new URLSearchParams(window.location.search).get("code");
    if (codeFromUrl) {
      setCode(codeFromUrl);
      void handleVerify(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="h-4 w-4" />
              Vérification publique
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Vérifier un bulletin</h1>
            <p className="mt-2 text-muted-foreground">
              Scannez le QR code du bulletin ou saisissez son code de vérification.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Code de vérification
            </CardTitle>
            <CardDescription>
              Le code commence généralement par <code>BUL-</code>. Si vous venez d&apos;un QR code, la vérification démarre automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Ex: BUL-2026CI001-..."
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleVerify()}
                className="flex-1"
              />
              <Button onClick={() => handleVerify()} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Vérifier
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.valid ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.valid ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-green-600">Bulletin authentique</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    <span className="text-red-600">Bulletin non reconnu</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.valid && result.bulletin ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Info label="Élève" value={`${result.bulletin.eleve.prenom} ${result.bulletin.eleve.nom}`} />
                    <Info label="Matricule" value={result.bulletin.eleve.matricule} />
                    <Info label="Classe" value={result.bulletin.eleve.classe} />
                    <Info label="Période" value={result.bulletin.periode} />
                    <Info label="Année scolaire" value={result.bulletin.anneeScolaire} />
                    <Info
                      label="Moyenne"
                      value={result.bulletin.moyenne !== null ? `${result.bulletin.moyenne.toFixed(2)}/20` : "-"}
                      className="text-lg text-blue-600"
                    />
                    <Info label="Rang" value={result.bulletin.rang !== null ? `${result.bulletin.rang}e` : "-"} />
                    <div>
                      <p className="text-sm text-muted-foreground">Mention</p>
                      {result.bulletin.mention ? (
                        <Badge className={mentionColors[result.bulletin.mention] || "bg-gray-100 text-gray-700"}>
                          {result.bulletin.mention}
                        </Badge>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Généré le {new Date(result.bulletin.dateGeneration).toLocaleDateString("fr-FR")}
                      {result.bulletin.generePar && ` par ${result.bulletin.generePar}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{result.message}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-medium ${className || ""}`}>{value}</p>
    </div>
  );
}
