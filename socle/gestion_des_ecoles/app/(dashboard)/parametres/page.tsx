"use client";

import { useState, useEffect } from "react";
import { Save, School, Calendar, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";

interface ParametresData {
  etablissement_nom: string;
  etablissement_telephone: string;
  etablissement_email: string;
  etablissement_adresse: string;
  annee_scolaire: string;
  note_max: string;
  moyenne_passage: string;
  notif_absences: string;
  notif_rappel_notes: string;
  notif_email: string;
}

const defaultParams: ParametresData = {
  etablissement_nom: "École Primaire Cheikh Anta Diop",
  etablissement_telephone: "+221 33 123 45 67",
  etablissement_email: "contact@ecole-cad.sn",
  etablissement_adresse: "Avenue Cheikh Anta Diop, Dakar, Sénégal",
  annee_scolaire: "2025-2026",
  note_max: "20",
  moyenne_passage: "10",
  notif_absences: "true",
  notif_rappel_notes: "true",
  notif_email: "false",
};

export default function ParametresPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<ParametresData>(defaultParams);

  const { data: parametresData, isLoading: isLoadingParams } = useQuery({
    queryKey: ["parametres"],
    queryFn: async () => {
      const response = await apiGet<Record<string, string>>("/parametres");
      return response.data;
    },
  });

  useEffect(() => {
    if (parametresData) {
      setParams({
        etablissement_nom: parametresData.etablissement_nom || defaultParams.etablissement_nom,
        etablissement_telephone: parametresData.etablissement_telephone || defaultParams.etablissement_telephone,
        etablissement_email: parametresData.etablissement_email || defaultParams.etablissement_email,
        etablissement_adresse: parametresData.etablissement_adresse || defaultParams.etablissement_adresse,
        annee_scolaire: parametresData.annee_scolaire || defaultParams.annee_scolaire,
        note_max: parametresData.note_max || defaultParams.note_max,
        moyenne_passage: parametresData.moyenne_passage || defaultParams.moyenne_passage,
        notif_absences: parametresData.notif_absences || defaultParams.notif_absences,
        notif_rappel_notes: parametresData.notif_rappel_notes || defaultParams.notif_rappel_notes,
        notif_email: parametresData.notif_email || defaultParams.notif_email,
      });
    }
  }, [parametresData]);

  const saveParams = useMutation({
    mutationFn: async (data: ParametresData) => {
      const response = await apiPost("/parametres", { parametres: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres"] });
      toast({ title: "Paramètres enregistrés", description: "Les modifications ont été sauvegardées" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les paramètres" });
    },
  });

  const handleSave = () => {
    saveParams.mutate(params);
  };

  if (isLoadingParams) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Configurez les paramètres de l'application">
        <Button onClick={handleSave} disabled={saveParams.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveParams.isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </PageHeader>

      <Tabs defaultValue="etablissement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="etablissement"><School className="h-4 w-4 mr-2" />Établissement</TabsTrigger>
          <TabsTrigger value="periodes"><Calendar className="h-4 w-4 mr-2" />Périodes</TabsTrigger>
          <TabsTrigger value="notation"><Settings className="h-4 w-4 mr-2" />Notation</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="etablissement">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l&apos;établissement</CardTitle>
              <CardDescription>Configurez les informations générales de votre établissement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de l&apos;établissement</Label>
                  <Input id="nom" value={params.etablissement_nom} onChange={(e) => setParams({ ...params, etablissement_nom: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" value={params.etablissement_telephone} onChange={(e) => setParams({ ...params, etablissement_telephone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={params.etablissement_email} onChange={(e) => setParams({ ...params, etablissement_email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annee">Année scolaire</Label>
                  <Input id="annee" value={params.annee_scolaire} onChange={(e) => setParams({ ...params, annee_scolaire: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Textarea id="adresse" value={params.etablissement_adresse} onChange={(e) => setParams({ ...params, etablissement_adresse: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periodes">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des périodes</CardTitle>
              <CardDescription>Configurez les trimestres de l&apos;année scolaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nom: "1er Trimestre", debut: "2025-10-01", fin: "2025-12-20", actif: true },
                  { nom: "2ème Trimestre", debut: "2026-01-05", fin: "2026-03-31", actif: false },
                  { nom: "3ème Trimestre", debut: "2026-04-15", fin: "2026-06-30", actif: false },
                ].map((periode, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{periode.nom}</p>
                      <p className="text-sm text-muted-foreground">Du {new Date(periode.debut).toLocaleDateString("fr-FR")} au {new Date(periode.fin).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch checked={periode.actif} />
                      <span className="text-sm">{periode.actif ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notation">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notation</CardTitle>
              <CardDescription>Configurez le système de notation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="noteMax">Note maximale par défaut</Label>
                  <Input id="noteMax" type="number" value={params.note_max} onChange={(e) => setParams({ ...params, note_max: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moyennePassable">Moyenne de passage</Label>
                  <Input id="moyennePassable" type="number" value={params.moyenne_passage} onChange={(e) => setParams({ ...params, moyenne_passage: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mentions</Label>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>Très Bien</span><span>≥ 16</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span>Bien</span><span>≥ 14</span>
                  </div>
                  <div className="flex justify-between p-2 bg-cyan-50 rounded">
                    <span>Assez Bien</span><span>≥ 12</span>
                  </div>
                  <div className="flex justify-between p-2 bg-yellow-50 rounded">
                    <span>Passable</span><span>≥ 10</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50 rounded">
                    <span>Insuffisant</span><span>&lt; 10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configurez les notifications système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Alertes absences non justifiées</p>
                  <p className="text-sm text-muted-foreground">Recevoir une alerte pour les absences non justifiées</p>
                </div>
                <Switch checked={params.notif_absences === "true"} onCheckedChange={(checked) => setParams({ ...params, notif_absences: checked ? "true" : "false" })} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Rappel saisie notes</p>
                  <p className="text-sm text-muted-foreground">Rappel pour les notes non saisies</p>
                </div>
                <Switch checked={params.notif_rappel_notes === "true"} onCheckedChange={(checked) => setParams({ ...params, notif_rappel_notes: checked ? "true" : "false" })} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notifications par email</p>
                  <p className="text-sm text-muted-foreground">Envoyer les notifications par email</p>
                </div>
                <Switch checked={params.notif_email === "true"} onCheckedChange={(checked) => setParams({ ...params, notif_email: checked ? "true" : "false" })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
