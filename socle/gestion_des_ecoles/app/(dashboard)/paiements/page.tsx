"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Wallet, 
  Plus, 
  Search, 
  Check, 
  Clock, 
  X, 
  Loader2,
  CreditCard,
  Banknote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  classe: { nom: string };
}

interface Versement {
  id: string;
  montant: number;
  datePaiement: string;
  modePaiement: string;
  reference: string | null;
}

interface Paiement {
  id: string;
  typeFrais: string;
  montantTotal: number;
  montantPaye: number;
  statut: string;
  anneeScolaire: string;
  echeance: string | null;
  description: string | null;
  eleve: Eleve;
  versements: Versement[];
}

interface Stats {
  totalPaiements: number;
  totalMontant: number;
  totalPaye: number;
  totalRestant: number;
  payes: number;
  partiels: number;
  nonPayes: number;
}

interface Classe {
  id: string;
  nom: string;
  niveau?: string;
}

const TYPE_FRAIS_LABELS: Record<string, string> = {
  INSCRIPTION: "Inscription",
  SCOLARITE: "Scolarité",
  CANTINE: "Cantine",
  TRANSPORT: "Transport",
  AUTRE: "Autre",
};

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: "Espèces",
  cheque: "Chèque",
  virement: "Virement",
  wave: "Wave",
  orange_money: "Orange Money",
};

export default function PaiementsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [classeFilter, setClasseFilter] = useState<string>("all");
  const [niveauFilter, setNiveauFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [versementDialogOpen, setVersementDialogOpen] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);

  // Form states
  const [newPaiement, setNewPaiement] = useState({
    eleveId: "",
    typeFrais: "SCOLARITE",
    montantTotal: "",
    anneeScolaire: "2025-2026",
    echeance: "",
    description: "",
  });

  const [newVersement, setNewVersement] = useState({
    montant: "",
    datePaiement: new Date().toISOString().split("T")[0],
    modePaiement: "especes",
    reference: "",
  });

  // Charger les classes
  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const response = await apiGet<Classe[]>("/classes");
      return response.data;
    },
  });

  // Charger les élèves
  const { data: elevesData } = useQuery({
    queryKey: ["eleves"],
    queryFn: async () => {
      const response = await apiGet<Eleve[]>("/eleves");
      return response.data;
    },
  });

  // Charger les paiements
  const { data: paiementsResponse, isLoading } = useQuery({
    queryKey: ["paiements", statutFilter, classeFilter],
    queryFn: async () => {
      let url = "/paiements?anneeScolaire=2025-2026";
      if (statutFilter !== "all") url += `&statut=${statutFilter}`;
      if (classeFilter !== "all") url += `&classeId=${classeFilter}`;
      const response = await apiGet<{ paiements: Paiement[]; stats: Stats }>(url);
      return response;
    },
  });

  // Créer un paiement
  const createPaiement = useMutation({
    mutationFn: async (data: typeof newPaiement) => {
      return apiPost("/paiements", {
        ...data,
        montantTotal: parseFloat(data.montantTotal),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paiements"] });
      toast({ title: "Succès", description: "Paiement créé" });
      setDialogOpen(false);
      setNewPaiement({
        eleveId: "",
        typeFrais: "SCOLARITE",
        montantTotal: "",
        anneeScolaire: "2025-2026",
        echeance: "",
        description: "",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de créer le paiement" });
    },
  });

  // Ajouter un versement
  const addVersement = useMutation({
    mutationFn: async (data: { paiementId: string; versement: typeof newVersement }) => {
      return apiPost(`/paiements/${data.paiementId}/versements`, {
        ...data.versement,
        montant: parseFloat(data.versement.montant),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paiements"] });
      toast({ title: "Succès", description: "Versement enregistré" });
      setVersementDialogOpen(false);
      setSelectedPaiement(null);
      setNewVersement({
        montant: "",
        datePaiement: new Date().toISOString().split("T")[0],
        modePaiement: "especes",
        reference: "",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le versement" });
    },
  });

  const paiements: Paiement[] = paiementsResponse?.data?.paiements || [];
  const stats = paiementsResponse?.data?.stats;
  
  // Debug: afficher les données dans la console
  console.log("paiementsResponse:", paiementsResponse);
  console.log("paiements:", paiements);
  console.log("stats:", stats);
  const classes = classesData || [];
  const eleves = elevesData || [];
  const niveaux = [...new Set(classes.map((classe) => classe.niveau).filter(Boolean))] as string[];
  const classesFiltrees =
    niveauFilter === "all" ? classes : classes.filter((classe) => classe.niveau === niveauFilter);

  // Filtrer par recherche
  const filteredPaiements = paiements.filter((p: Paiement) => {
    if (!p.eleve) return true;
    if (niveauFilter !== "all") {
      const classe = classes.find((item) => item.nom === p.eleve.classe?.nom);
      if (classe?.niveau && classe.niveau !== niveauFilter) return false;
    }
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (p.eleve.nom?.toLowerCase() || "").includes(searchLower) ||
      (p.eleve.prenom?.toLowerCase() || "").includes(searchLower) ||
      (p.eleve.matricule?.toLowerCase() || "").includes(searchLower)
    );
  });

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Paiements"
        description="Suivi des frais de scolarité et paiements"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau paiement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un paiement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Élève</Label>
                <Select value={newPaiement.eleveId} onValueChange={(v) => setNewPaiement({ ...newPaiement, eleveId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un élève" />
                  </SelectTrigger>
                  <SelectContent>
                    {eleves.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.prenom} {e.nom} ({e.matricule})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type de frais</Label>
                <Select value={newPaiement.typeFrais} onValueChange={(v) => setNewPaiement({ ...newPaiement, typeFrais: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_FRAIS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant total (FCFA)</Label>
                <Input
                  type="number"
                  value={newPaiement.montantTotal}
                  onChange={(e) => setNewPaiement({ ...newPaiement, montantTotal: e.target.value })}
                  placeholder="Ex: 150000"
                />
              </div>
              <div className="space-y-2">
                <Label>Échéance (optionnel)</Label>
                <Input
                  type="date"
                  value={newPaiement.echeance}
                  onChange={(e) => setNewPaiement({ ...newPaiement, echeance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Input
                  value={newPaiement.description}
                  onChange={(e) => setNewPaiement({ ...newPaiement, description: e.target.value })}
                  placeholder="Ex: Frais du 1er trimestre"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => createPaiement.mutate(newPaiement)}
                disabled={createPaiement.isPending || !newPaiement.eleveId || !newPaiement.montantTotal}
              >
                {createPaiement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer le paiement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total à percevoir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(stats.totalMontant)}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total perçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(stats.totalPaye)}</div>
              <p className="text-xs text-green-600">{stats.payes} paiement(s) soldé(s)</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Reste à percevoir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatMontant(stats.totalRestant)}</div>
              <p className="text-xs text-red-600">{stats.nonPayes} non payé(s), {stats.partiels} partiel(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taux de recouvrement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalMontant > 0 ? Math.round((stats.totalPaye / stats.totalMontant) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un élève..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PAYE">Payé</SelectItem>
                <SelectItem value="PARTIEL">Partiel</SelectItem>
                <SelectItem value="NON_PAYE">Non payé</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={niveauFilter}
              onValueChange={(value) => {
                setNiveauFilter(value);
                setClasseFilter("all");
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {niveaux.map((niveau) => (
                  <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classeFilter} onValueChange={setClasseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classesFiltrees.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des paiements */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredPaiements.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun paiement trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaiements.map((paiement) => (
                  <TableRow key={paiement.id}>
                    <TableCell className="font-medium">
                      {paiement.eleve.prenom} {paiement.eleve.nom}
                      <br />
                      <span className="text-xs text-muted-foreground">{paiement.eleve.matricule}</span>
                    </TableCell>
                    <TableCell>{paiement.eleve.classe.nom}</TableCell>
                    <TableCell>{TYPE_FRAIS_LABELS[paiement.typeFrais]}</TableCell>
                    <TableCell className="text-right">{formatMontant(Number(paiement.montantTotal))}</TableCell>
                    <TableCell className="text-right text-green-600">{formatMontant(Number(paiement.montantPaye))}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatMontant(Number(paiement.montantTotal) - Number(paiement.montantPaye))}
                    </TableCell>
                    <TableCell>{getStatutBadge(paiement.statut)}</TableCell>
                    <TableCell>
                      {paiement.statut !== "PAYE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPaiement(paiement);
                            setVersementDialogOpen(true);
                          }}
                        >
                          <Banknote className="h-4 w-4 mr-1" />
                          Payer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Versement */}
      <Dialog open={versementDialogOpen} onOpenChange={setVersementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un versement</DialogTitle>
          </DialogHeader>
          {selectedPaiement && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedPaiement.eleve.prenom} {selectedPaiement.eleve.nom}</p>
                <p className="text-sm text-muted-foreground">
                  Reste à payer: {formatMontant(Number(selectedPaiement.montantTotal) - Number(selectedPaiement.montantPaye))}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  value={newVersement.montant}
                  onChange={(e) => setNewVersement({ ...newVersement, montant: e.target.value })}
                  placeholder="Ex: 50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de paiement</Label>
                <Input
                  type="date"
                  value={newVersement.datePaiement}
                  onChange={(e) => setNewVersement({ ...newVersement, datePaiement: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={newVersement.modePaiement} onValueChange={(v) => setNewVersement({ ...newVersement, modePaiement: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Référence (optionnel)</Label>
                <Input
                  value={newVersement.reference}
                  onChange={(e) => setNewVersement({ ...newVersement, reference: e.target.value })}
                  placeholder="Ex: N° chèque, N° transaction"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => addVersement.mutate({ paiementId: selectedPaiement.id, versement: newVersement })}
                disabled={addVersement.isPending || !newVersement.montant}
              >
                {addVersement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CreditCard className="h-4 w-4 mr-2" />
                Enregistrer le versement
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
