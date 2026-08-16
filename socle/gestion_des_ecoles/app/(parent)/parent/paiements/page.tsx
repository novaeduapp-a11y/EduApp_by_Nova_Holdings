"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  CreditCard, 
  Check, 
  Clock, 
  X, 
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";

interface Paiement {
  id: string;
  typeFrais: string;
  montantTotal: number;
  montantPaye: number;
  statut: string;
  echeance: string;
  eleve: {
    nom: string;
    prenom: string;
    classe: string;
  };
  versements: Array<{
    montant: number;
    date: string;
    modePaiement: string;
  }>;
}

interface Enfant {
  id: string;
  nom: string;
  prenom: string;
}

const TYPE_FRAIS_LABELS: Record<string, string> = {
  SCOLARITE: "Frais de scolarité",
  INSCRIPTION: "Frais d&apos;inscription",
  CANTINE: "Cantine",
  TRANSPORT: "Transport",
  FOURNITURES: "Fournitures",
  AUTRE: "Autre",
};

export default function PaiementsParentPage() {
  const { data: enfantsData } = useQuery({
    queryKey: ["parent-enfants"],
    queryFn: async () => {
      const response = await apiGet<Enfant[]>("/parent/enfants");
      return response.data;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const enfants = enfantsData || [];

  // Pour l'instant, on simule des données de paiements
  // TODO: Créer une API /parent/paiements qui récupère les paiements des enfants
  const paiements: Paiement[] = [];
  const isLoading = false;

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "PAYE":
        return <Badge className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" />Payé</Badge>;
      case "PARTIEL":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Partiel</Badge>;
      default:
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Non payé</Badge>;
    }
  };

  // Calculs des statistiques
  const totalDu = paiements.reduce((acc, p) => acc + p.montantTotal, 0);
  const totalPaye = paiements.reduce((acc, p) => acc + p.montantPaye, 0);
  const totalRestant = totalDu - totalPaye;
  const pourcentagePaye = totalDu > 0 ? (totalPaye / totalDu) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mes Paiements</h1>
        <p className="text-muted-foreground">
          Suivez les frais de scolarité de vos enfants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total dû
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(totalDu)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pour l&apos;année scolaire 2025-2026
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total payé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
            <Progress value={pourcentagePaye} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {pourcentagePaye.toFixed(0)}% des frais réglés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Reste à payer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatMontant(totalRestant)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              À régler avant la fin du trimestre
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Détail des frais et versements pour chaque enfant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paiements.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun paiement enregistré</h3>
              <p className="text-muted-foreground mt-1">
                Les frais de scolarité de vos enfants apparaîtront ici une fois enregistrés par l&apos;administration.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enfant</TableHead>
                  <TableHead>Type de frais</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Échéance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paiements.map((paiement) => (
                  <TableRow key={paiement.id}>
                    <TableCell className="font-medium">
                      {paiement.eleve.prenom} {paiement.eleve.nom}
                      <br />
                      <span className="text-xs text-muted-foreground">{paiement.eleve.classe}</span>
                    </TableCell>
                    <TableCell>{TYPE_FRAIS_LABELS[paiement.typeFrais] || paiement.typeFrais}</TableCell>
                    <TableCell className="text-right">{formatMontant(paiement.montantTotal)}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatMontant(paiement.montantPaye)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatMontant(paiement.montantTotal - paiement.montantPaye)}
                    </TableCell>
                    <TableCell>{getStatutBadge(paiement.statut)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(paiement.echeance).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Modes de paiement acceptés</h4>
              <p className="text-sm text-blue-700">
                Espèces, chèque, virement bancaire, Orange Money, Wave. 
                Pour tout paiement, veuillez vous rendre à l&apos;administration de l&apos;école.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
