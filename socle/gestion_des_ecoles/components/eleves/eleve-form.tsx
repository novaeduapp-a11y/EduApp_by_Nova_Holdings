"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createEleveSchema, type CreateEleveInput } from "@/lib/validations/eleve";
import { useClasses } from "@/hooks/use-classes";
import type { EleveWithClasse } from "@/types";

interface EleveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEleveInput & { createAccount?: boolean }) => void;
  isLoading?: boolean;
  eleve?: EleveWithClasse | null;
}

export function EleveForm({ open, onOpenChange, onSubmit, isLoading, eleve }: EleveFormProps) {
  const { data: classesData } = useClasses();
  const classes = classesData?.data || [];
  const [createAccount, setCreateAccount] = useState(!eleve); // Par défaut coché pour les nouveaux élèves

  interface FormData {
    nom: string;
    prenom: string;
    dateNaissance: string;
    lieuNaissance?: string;
    sexe: "M" | "F";
    classeId: string;
    nomPere?: string;
    telephonePere?: string;
    nomMere?: string;
    telephoneMere?: string;
    nomTuteur?: string;
    telephoneTuteur?: string;
    emailParent: string;
    adresse?: string;
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createEleveSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      dateNaissance: "",
      lieuNaissance: "",
      sexe: "M",
      classeId: "",
      nomPere: "",
      telephonePere: "",
      nomMere: "",
      telephoneMere: "",
      nomTuteur: "",
      telephoneTuteur: "",
      emailParent: "",
      adresse: "",
    },
  });

  const selectedSexe = watch("sexe");
  const selectedClasseId = watch("classeId");

  // Réinitialiser le formulaire quand eleve change
  useEffect(() => {
    if (eleve) {
      reset({
        nom: eleve.nom,
        prenom: eleve.prenom,
        dateNaissance: eleve.dateNaissance ? new Date(eleve.dateNaissance).toISOString().split("T")[0] : "",
        lieuNaissance: eleve.lieuNaissance || "",
        sexe: eleve.sexe,
        classeId: eleve.classeId,
        nomPere: eleve.nomPere || "",
        telephonePere: eleve.telephonePere || "",
        nomMere: eleve.nomMere || "",
        telephoneMere: eleve.telephoneMere || "",
        nomTuteur: eleve.nomTuteur || "",
        telephoneTuteur: eleve.telephoneTuteur || "",
        emailParent: eleve.emailParent || "",
        adresse: eleve.adresse || "",
      });
    } else {
      reset({
        nom: "",
        prenom: "",
        dateNaissance: "",
        lieuNaissance: "",
        sexe: "M",
        classeId: "",
        nomPere: "",
        telephonePere: "",
        nomMere: "",
        telephoneMere: "",
        nomTuteur: "",
        telephoneTuteur: "",
        emailParent: "",
        adresse: "",
      });
    }
  }, [eleve, reset]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit({ ...data, createAccount } as CreateEleveInput & { createAccount?: boolean });
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{eleve ? "Modifier l'élève" : "Nouvel élève"}</DialogTitle>
          <DialogDescription>
            {eleve ? "Modifiez les informations de l'élève" : "Remplissez les informations pour inscrire un nouvel élève"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" {...register("prenom")} placeholder="Prénom" />
                {errors.prenom && <p className="text-sm text-red-500">{errors.prenom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" {...register("nom")} placeholder="Nom" />
                {errors.nom && <p className="text-sm text-red-500">{errors.nom.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateNaissance">Date de naissance *</Label>
                <Input id="dateNaissance" type="date" {...register("dateNaissance")} />
                {errors.dateNaissance && <p className="text-sm text-red-500">{errors.dateNaissance.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                <Input id="lieuNaissance" {...register("lieuNaissance")} placeholder="Dakar" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sexe *</Label>
                <Select value={selectedSexe} onValueChange={(value) => setValue("sexe", value as "M" | "F")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sexe && <p className="text-sm text-red-500">{errors.sexe.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Classe *</Label>
                <Select value={selectedClasseId} onValueChange={(value) => setValue("classeId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classe) => (
                      <SelectItem key={classe.id} value={classe.id}>
                        {classe.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classeId && <p className="text-sm text-red-500">{errors.classeId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" {...register("adresse")} placeholder="Adresse complète" />
            </div>
          </div>

          {/* Informations parents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">Informations des parents</h3>
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">Au moins 1 téléphone requis</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomPere">Nom du père</Label>
                <Input id="nomPere" {...register("nomPere")} placeholder="Nom complet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephonePere">Téléphone du père *</Label>
                <Input id="telephonePere" {...register("telephonePere")} placeholder="77 123 45 67" />
                {errors.telephonePere && <p className="text-sm text-red-500">{errors.telephonePere.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomMere">Nom de la mère</Label>
                <Input id="nomMere" {...register("nomMere")} placeholder="Nom complet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephoneMere">Téléphone de la mère *</Label>
                <Input id="telephoneMere" {...register("telephoneMere")} placeholder="78 123 45 67" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomTuteur">Nom du tuteur</Label>
                <Input id="nomTuteur" {...register("nomTuteur")} placeholder="Si différent des parents" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephoneTuteur">Téléphone du tuteur *</Label>
                <Input id="telephoneTuteur" {...register("telephoneTuteur")} placeholder="76 123 45 67" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailParent">Email parent/tuteur *</Label>
              <Input id="emailParent" type="email" {...register("emailParent")} placeholder="email@exemple.com" />
              {errors.emailParent && <p className="text-sm text-red-500">{errors.emailParent.message}</p>}
              <p className="text-xs text-muted-foreground">Cet email sera utilisé pour créer le compte parent</p>
            </div>
          </div>

          {/* Option création de compte élève */}
          {!eleve && (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="createAccount"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="h-4 w-4 mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="createAccount" className="flex items-center gap-2 cursor-pointer">
                    <UserPlus className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Créer un compte élève</span>
                  </Label>
                  <p className="text-xs text-green-700 mt-1">
                    Un compte sera créé automatiquement avec le matricule comme identifiant. 
                    L&apos;élève pourra se connecter pour voir ses notes et bulletins.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {eleve ? "Enregistrer" : "Inscrire l'élève"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
