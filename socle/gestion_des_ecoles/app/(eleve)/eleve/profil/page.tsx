"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";

interface ProfilData {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  dateNaissance: string;
  lieuNaissance: string | null;
  sexe: string;
  classe: string;
  cycle: string | null;
  adresse: string | null;
  photo: string | null;
  nomPere: string | null;
  telephonePere: string | null;
  nomMere: string | null;
  telephoneMere: string | null;
  emailParent: string | null;
}

export default function EleveProfilPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["eleve-profil"],
    queryFn: async () => {
      const response = await apiGet<ProfilData>("/eleve/profil");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profil non trouvé</p>
      </div>
    );
  }

  const initials = `${data.prenom[0]}${data.nom[0]}`.toUpperCase();
  const age = Math.floor((new Date().getTime() - new Date(data.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/eleve">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Mon Profil
          </h1>
          <p className="text-muted-foreground">Tes informations personnelles</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Carte profil */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className={`text-2xl ${data.sexe === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{data.prenom} {data.nom}</h2>
              <p className="text-muted-foreground">{data.matricule}</p>
              <div className="flex gap-2 mt-3">
                <Badge className={data.sexe === "M" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}>
                  {data.sexe === "M" ? "Masculin" : "Féminin"}
                </Badge>
                <Badge className="bg-green-100 text-green-700">{age} ans</Badge>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>Classe: <strong>{data.classe}</strong></span>
              </div>
              {data.cycle && (
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>Cycle: <strong>{data.cycle}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Né(e) le: <strong>{new Date(data.dateNaissance).toLocaleDateString("fr-FR")}</strong></span>
              </div>
              {data.lieuNaissance && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>À: <strong>{data.lieuNaissance}</strong></span>
                </div>
              )}
              {data.adresse && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Adresse: <strong>{data.adresse}</strong></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations parents */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations des Parents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {data.nomPere && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Père
                  </h4>
                  <p className="text-sm mt-2">{data.nomPere}</p>
                  {data.telephonePere && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />{data.telephonePere}
                    </p>
                  )}
                </div>
              )}
              {data.nomMere && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Mère
                  </h4>
                  <p className="text-sm mt-2">{data.nomMere}</p>
                  {data.telephoneMere && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />{data.telephoneMere}
                    </p>
                  )}
                </div>
              )}
              {data.emailParent && (
                <div className="p-4 border rounded-lg md:col-span-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Parent
                  </h4>
                  <p className="text-sm mt-2">{data.emailParent}</p>
                </div>
              )}
            </div>
            {!data.nomPere && !data.nomMere && (
              <p className="text-center text-muted-foreground py-8">
                Aucune information sur les parents
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
