"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Shield,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiGet } from "@/lib/api";
import Link from "next/link";

interface Enfant {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  classe: string;
  relation: string;
}

export default function ProfilParentPage() {
  const { data: session } = useSession();

  const { data: enfantsData } = useQuery({
    queryKey: ["parent-enfants"],
    queryFn: async () => {
      const response = await apiGet<Enfant[]>("/parent/enfants");
      return response.data;
    },
  });

  const enfants = enfantsData || [];
  const user = session?.user;

  const userInitials = user ? 
    `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}` : 'P';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Carte Profil Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informations personnelles</CardTitle>
              <Button variant="outline" size="sm" disabled>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar et nom */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user?.prenom} {user?.nom}</h2>
                <Badge className="mt-2 bg-blue-100 text-blue-700">
                  <Shield className="h-3 w-3 mr-1" />
                  Parent
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Informations de contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || "Non renseigné"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">Non renseigné</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-full">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium">Non renseignée</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Membre depuis</p>
                  <p className="font-medium">Janvier 2026</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Enfants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mes Enfants
            </CardTitle>
            <CardDescription>
              {enfants.length} enfant(s) associé(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {enfants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun enfant associé
              </p>
            ) : (
              enfants.map((enfant) => (
                <Link 
                  key={enfant.id} 
                  href={`/parent/enfant/${enfant.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-sm">
                        {enfant.prenom[0]}{enfant.nom[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {enfant.prenom} {enfant.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {enfant.classe} • {enfant.relation}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {enfant.matricule}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Mot de passe</p>
              <p className="text-sm text-muted-foreground">
                Dernière modification : il y a plus de 30 jours
              </p>
            </div>
            <Button variant="outline" disabled>
              Changer le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <User className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-amber-900">Besoin de modifier vos informations ?</h4>
              <p className="text-sm text-amber-700">
                Contactez l&apos;administration de l&apos;école pour mettre à jour vos coordonnées ou associer de nouveaux enfants à votre compte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
