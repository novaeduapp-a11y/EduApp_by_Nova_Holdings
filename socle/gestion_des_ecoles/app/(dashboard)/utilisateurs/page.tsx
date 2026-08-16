"use client";
// Cache invalidation: 2026-01-25T16:17:00

import { useState } from "react";
import { Search, MoreHorizontal, Pencil, Trash2, UserPlus, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  DIRECTEUR: "bg-blue-100 text-blue-700",
  PROFESSEUR: "bg-green-100 text-green-700",
  PARENT: "bg-purple-100 text-purple-700",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  DIRECTEUR: "Directeur",
  PROFESSEUR: "Professeur",
  PARENT: "Parent",
};

interface UserForm {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: "ADMIN" | "DIRECTEUR" | "PROFESSEUR" | "PARENT";
  telephone: string;
}

const initialForm: UserForm = {
  nom: "",
  prenom: "",
  email: "",
  password: "",
  role: "PROFESSEUR",
  telephone: "",
};

export default function UtilisateursPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForm | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);

  const { data: usersData, isLoading } = useUsers({ page, limit: 10, search, role: roleFilter });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = usersData?.data || [];
  const meta = usersData?.meta;

  const handleOpenCreate = () => {
    setForm(initialForm);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserForm) => {
    setForm({ ...user, password: "" });
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user: UserForm) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires" });
      return;
    }

    if (!selectedUser?.id && !form.password) {
      toast({ variant: "destructive", title: "Erreur", description: "Le mot de passe est requis" });
      return;
    }

    try {
      if (selectedUser?.id) {
        const updateData: Record<string, unknown> = {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          role: form.role,
          telephone: form.telephone || undefined,
        };
        if (form.password) {
          updateData.password = form.password;
        }
        await updateUser.mutateAsync({ id: selectedUser.id, data: updateData });
        toast({ title: "Succès", description: "Utilisateur modifié avec succès" });
      } else {
        await createUser.mutateAsync({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
          role: form.role,
          telephone: form.telephone || undefined,
        });
        toast({ title: "Succès", description: "Utilisateur créé avec succès" });
      }
      setIsModalOpen(false);
      setForm(initialForm);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue" });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser?.id) return;
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast({ title: "Succès", description: "Utilisateur supprimé avec succès" });
      setIsDeleteOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer cet utilisateur" });
    }
  };

  // Stats
  const stats = {
    total: meta?.total || 0,
    admins: users.filter((u) => u.role === "ADMIN").length,
    directeurs: users.filter((u) => u.role === "DIRECTEUR").length,
    professeurs: users.filter((u) => u.role === "PROFESSEUR").length,
    parents: users.filter((u) => u.role === "PARENT").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gestion des Utilisateurs" description="Gérez les comptes utilisateurs de l'application">
        <Button onClick={handleOpenCreate}>
          <UserPlus className="h-4 w-4 mr-2" />Nouvel utilisateur
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administrateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Directeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.directeurs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Professeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.professeurs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.parents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="DIRECTEUR">Directeur</SelectItem>
                <SelectItem value="PROFESSEUR">Professeur</SelectItem>
                <SelectItem value="PARENT">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>Gérez les comptes et les permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={roleColors[user.role]}>
                              {user.prenom[0]}{user.nom[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.prenom} {user.nom}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role] || "bg-gray-100 text-gray-700"}>
                          <Shield className="h-3 w-3 mr-1" />
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.telephone || "-"}</TableCell>
                      <TableCell>
                        <Badge className={user.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {user.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(user as unknown as UserForm)}>
                              <Pencil className="h-4 w-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleOpenDelete(user as unknown as UserForm)}>
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {users.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  Aucun utilisateur trouvé
                </div>
              )}

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Précédent
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} sur {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === meta.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Création/Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser?.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
            <DialogDescription>
              {selectedUser?.id ? "Modifiez les informations de l'utilisateur" : "Créez un nouveau compte utilisateur"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{selectedUser?.id ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Rôle *</Label>
              <Select value={form.role} onValueChange={(value: "ADMIN" | "DIRECTEUR" | "PROFESSEUR") => setForm({ ...form, role: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="DIRECTEUR">Directeur</SelectItem>
                  <SelectItem value="PROFESSEUR">Professeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createUser.isPending || updateUser.isPending}>
              {(createUser.isPending || updateUser.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedUser?.id ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedUser?.prenom} ${selectedUser?.nom} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}
