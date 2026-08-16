"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Plus, 
  Search, 
  Loader2,
  Mail,
  Phone,
  UserCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
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
  emailParent?: string | null;
  nomPere?: string | null;
  nomMere?: string | null;
  nomTuteur?: string | null;
  telephonePere?: string | null;
  telephoneMere?: string | null;
  telephoneTuteur?: string | null;
}

interface ParentEleve {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    classe: { nom: string };
  };
}

interface Parent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  actif: boolean;
  createdAt: string;
  parentEleves: ParentEleve[];
}

export default function ParentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedEleves, setSelectedEleves] = useState<string[]>([]);
  const [autoDetectedEleves, setAutoDetectedEleves] = useState<string[]>([]);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  const [newParent, setNewParent] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    relation: "parent",
  });

  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    actif: true,
  });

  // Charger les parents
  const { data: parentsResponse, isLoading } = useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const response = await apiGet<Parent[]>("/parents");
      return response;
    },
  });

  // Charger les élèves avec les infos parent
  const { data: elevesResponse } = useQuery({
    queryKey: ["eleves-for-parents"],
    queryFn: async () => {
      const response = await apiGet<Eleve[]>("/eleves?limit=500&includeParentInfo=true");
      return response;
    },
  });

  // Détecter automatiquement les élèves et auto-remplir les infos parent
  const detectEleves = (email: string, telephone: string, currentParent: typeof newParent) => {
    if (eleves.length === 0) return;
    
    let parentInfo: { nom?: string; prenom?: string; telephone?: string } = {};
    
    const matchingEleves = eleves.filter((e: Eleve) => {
      // Correspondance par email
      if (email && email.includes("@") && e.emailParent) {
        if (e.emailParent.toLowerCase() === email.toLowerCase()) {
          // Extraire le nom du père ou de la mère si disponible
          if (e.nomPere) {
            const parts = e.nomPere.split(" ");
            parentInfo = { 
              prenom: parts[0] || "", 
              nom: parts.slice(1).join(" ") || parts[0] || "",
              telephone: e.telephonePere || undefined
            };
          } else if (e.nomMere) {
            const parts = e.nomMere.split(" ");
            parentInfo = { 
              prenom: parts[0] || "", 
              nom: parts.slice(1).join(" ") || parts[0] || "",
              telephone: e.telephoneMere || undefined
            };
          }
          return true;
        }
      }
      // Correspondance par téléphone (père, mère ou tuteur)
      if (telephone && telephone.length >= 6) {
        const telNormalized = telephone.replace(/\s/g, "");
        if (e.telephonePere?.replace(/\s/g, "") === telNormalized) {
          if (e.nomPere) {
            const parts = e.nomPere.split(" ");
            parentInfo = { prenom: parts[0] || "", nom: parts.slice(1).join(" ") || parts[0] || "" };
          }
          return true;
        }
        if (e.telephoneMere?.replace(/\s/g, "") === telNormalized) {
          if (e.nomMere) {
            const parts = e.nomMere.split(" ");
            parentInfo = { prenom: parts[0] || "", nom: parts.slice(1).join(" ") || parts[0] || "" };
          }
          return true;
        }
        if (e.telephoneTuteur?.replace(/\s/g, "") === telNormalized) {
          if (e.nomTuteur) {
            const parts = e.nomTuteur.split(" ");
            parentInfo = { prenom: parts[0] || "", nom: parts.slice(1).join(" ") || parts[0] || "" };
          }
          return true;
        }
      }
      return false;
    });
    
    const matchingIds = matchingEleves.map((e: Eleve) => e.id);
    setAutoDetectedEleves(matchingIds);
    
    // Ajouter automatiquement les élèves détectés à la sélection
    if (matchingIds.length > 0) {
      setSelectedEleves(matchingIds);
      // Auto-remplir les infos du parent si trouvées et champs vides
      if (parentInfo.nom || parentInfo.prenom) {
        setNewParent({
          ...currentParent,
          nom: currentParent.nom || parentInfo.nom || "",
          prenom: currentParent.prenom || parentInfo.prenom || "",
          telephone: currentParent.telephone || parentInfo.telephone || "",
        });
      }
    } else {
      setSelectedEleves([]);
    }
  };

  const handleEmailChange = (email: string) => {
    const updated = { ...newParent, email };
    setNewParent(updated);
    detectEleves(email, newParent.telephone, updated);
  };

  const handleTelephoneChange = (telephone: string) => {
    const updated = { ...newParent, telephone };
    setNewParent(updated);
    detectEleves(newParent.email, telephone, updated);
  };

  // Vérifier si on peut afficher la section enfants
  const canShowEnfants = (newParent.email && newParent.email.includes("@")) || 
                         (newParent.telephone && newParent.telephone.length >= 6);

  // Créer un parent
  const createParent = useMutation({
    mutationFn: async (data: typeof newParent & { eleveIds: string[] }) => {
      return apiPost("/parents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      toast({ title: "Succès", description: "Compte parent créé avec succès" });
      setDialogOpen(false);
      setNewParent({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        password: "",
        relation: "parent",
      });
      setSelectedEleves([]);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message || "Vérifiez que l'email est valide (ex: parent@email.com)" });
    },
  });

  // Mutation pour modifier un parent
  const updateParent = useMutation({
    mutationFn: async (data: { id: string; nom: string; prenom: string; telephone: string; actif: boolean }) => {
      const response = await apiPost(`/parents/${data.id}`, {
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        actif: data.actif,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      toast({ title: "Succès", description: "Parent modifié avec succès" });
      setEditDialogOpen(false);
      setEditingParent(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le parent" });
    },
  });

  const parents = parentsResponse?.data || [];
  const eleves = elevesResponse?.data || [];

  // Filtrer par recherche
  const filteredParents = parents.filter((p: Parent) => {
    const searchLower = search.toLowerCase();
    return (
      p.nom.toLowerCase().includes(searchLower) ||
      p.prenom.toLowerCase().includes(searchLower) ||
      p.email.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = () => {
    if (!newParent.nom || !newParent.prenom || !newParent.email || !newParent.password) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires" });
      return;
    }
    if (selectedEleves.length === 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner au moins un élève" });
      return;
    }
    createParent.mutate({ ...newParent, eleveIds: selectedEleves });
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewParent({ ...newParent, password });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEleve = (eleveId: string) => {
    if (selectedEleves.includes(eleveId)) {
      setSelectedEleves(selectedEleves.filter((id) => id !== eleveId));
    } else {
      setSelectedEleves([...selectedEleves, eleveId]);
    }
  };

  const openEditDialog = (parent: Parent) => {
    setEditingParent(parent);
    setEditForm({
      nom: parent.nom,
      prenom: parent.prenom,
      telephone: parent.telephone || "",
      actif: parent.actif,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingParent || !editForm.nom || !editForm.prenom) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires" });
      return;
    }
    updateParent.mutate({
      id: editingParent.id,
      ...editForm,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Parents"
        description="Créez et gérez les comptes d'accès pour les parents"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau compte parent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un compte parent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={newParent.nom}
                    onChange={(e) => setNewParent({ ...newParent, nom: e.target.value })}
                    placeholder="Ex: Diallo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input
                    value={newParent.prenom}
                    onChange={(e) => setNewParent({ ...newParent, prenom: e.target.value })}
                    placeholder="Ex: Mamadou"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newParent.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Ex: parent@email.com"
                  />
                  {autoDetectedEleves.length > 0 && (
                    <p className="text-xs text-green-600">
                      ✓ {autoDetectedEleves.length} élève(s) détecté(s) automatiquement
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={newParent.telephone}
                    onChange={(e) => handleTelephoneChange(e.target.value)}
                    placeholder="Ex: 77 123 45 67"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newParent.password}
                      onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                      placeholder="Minimum 6 caractères"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Générer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Relation</Label>
                <Select value={newParent.relation} onValueChange={(v) => setNewParent({ ...newParent, relation: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="pere">Père</SelectItem>
                    <SelectItem value="mere">Mère</SelectItem>
                    <SelectItem value="tuteur">Tuteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!canShowEnfants ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-700">
                    Saisissez l&apos;email ou le téléphone du parent pour voir les enfants associés
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Enfants à associer *</Label>
                  {autoDetectedEleves.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ {autoDetectedEleves.length} enfant(s) trouvé(s) automatiquement !
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                      <p className="text-sm text-orange-700">
                        Aucun enfant trouvé avec cet email/téléphone. Vous pouvez sélectionner manuellement.
                      </p>
                    </div>
                  )}
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {eleves.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucun élève disponible</p>
                    ) : (
                      // Trier pour afficher les élèves auto-détectés en premier
                      [...eleves]
                        .sort((a: Eleve, b: Eleve) => {
                          const aAuto = autoDetectedEleves.includes(a.id) ? -1 : 0;
                          const bAuto = autoDetectedEleves.includes(b.id) ? -1 : 0;
                          return aAuto - bAuto;
                        })
                        .map((eleve: Eleve) => {
                          const isAutoDetected = autoDetectedEleves.includes(eleve.id);
                          const isSelected = selectedEleves.includes(eleve.id);
                          return (
                            <div
                              key={eleve.id}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                isSelected 
                                  ? isAutoDetected 
                                    ? "bg-green-100 border border-green-400" 
                                    : "bg-blue-100 border border-blue-300" 
                                  : "bg-gray-50 hover:bg-gray-100"
                              }`}
                              onClick={() => toggleEleve(eleve.id)}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{eleve.prenom} {eleve.nom}</p>
                                  {isAutoDetected && (
                                    <Badge className="bg-green-500 text-white text-xs">Auto-détecté</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{eleve.matricule} - {eleve.classe?.nom}</p>
                                {eleve.emailParent && (
                                  <p className="text-xs text-blue-600">Email parent: {eleve.emailParent}</p>
                                )}
                              </div>
                              {isSelected && (
                                <Check className={`h-5 w-5 ${isAutoDetected ? "text-green-600" : "text-blue-600"}`} />
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                  {selectedEleves.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedEleves.length} élève(s) sélectionné(s)
                      {autoDetectedEleves.length > 0 && ` (dont ${autoDetectedEleves.filter(id => selectedEleves.includes(id)).length} auto-détecté(s))`}
                    </p>
                  )}
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={createParent.isPending}
              >
                {createParent.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Créer le compte parent
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {parents.filter((p: Parent) => p.actif).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enfants liés</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {parents.reduce((acc: number, p: Parent) => acc + p.parentEleves.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un parent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des parents */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des comptes parents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun compte parent trouvé</p>
              <p className="text-sm">Créez un compte pour permettre aux parents de suivre leurs enfants</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Enfants</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParents.map((parent: Parent) => (
                  <TableRow key={parent.id}>
                    <TableCell className="font-medium">
                      {parent.prenom} {parent.nom}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {parent.email}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(parent.email, parent.id)}
                          >
                            {copiedId === parent.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        {parent.telephone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {parent.telephone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {parent.parentEleves.map((pe: ParentEleve) => (
                          <Badge key={pe.eleve.id} variant="outline" className="mr-1">
                            {pe.eleve.prenom} {pe.eleve.nom}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={parent.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {parent.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(parent)}>
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le compte parent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prenom">Prénom *</Label>
                <Input
                  id="edit-prenom"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom *</Label>
                <Input
                  id="edit-nom"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telephone">Téléphone</Label>
              <Input
                id="edit-telephone"
                value={editForm.telephone}
                onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                placeholder="77 123 45 67"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-actif"
                checked={editForm.actif}
                onChange={(e) => setEditForm({ ...editForm, actif: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-actif">Compte actif</Label>
            </div>
            {editingParent && (
              <div className="text-sm text-muted-foreground">
                <p>Email : {editingParent.email}</p>
                <p>Enfants : {editingParent.parentEleves.map(pe => `${pe.eleve.prenom} ${pe.eleve.nom}`).join(", ") || "Aucun"}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateParent.isPending}>
              {updateParent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
