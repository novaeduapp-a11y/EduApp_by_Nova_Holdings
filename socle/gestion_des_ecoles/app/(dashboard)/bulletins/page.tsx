"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, QrCode, Search, Loader2, Download, Eye, MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/hooks/use-toast";
import { useBulletins } from "@/hooks/use-bulletins";
import { useClasses } from "@/hooks/use-classes";
import { usePeriodes } from "@/hooks/use-notes";
import { DownloadBulletinButton } from "@/components/bulletins/download-bulletin";

const mentionColors: Record<string, string> = {
  "Très Bien": "bg-green-100 text-green-700",
  "Bien": "bg-blue-100 text-blue-700",
  "Assez Bien": "bg-cyan-100 text-cyan-700",
  "Passable": "bg-yellow-100 text-yellow-700",
  "Insuffisant": "bg-red-100 text-red-700",
};

export default function BulletinsPage() {
  useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialiser les filtres depuis l'URL
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [classeFilter, setClasseFilter] = useState<string>(searchParams.get("classe") || "all");
  const [niveauFilter, setNiveauFilter] = useState<string>(searchParams.get("niveau") || "all");
  const [periodeFilter, setPeriodeFilter] = useState<string>(searchParams.get("periode") || "all");

  // Mettre à jour l'URL quand les filtres changent
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (niveauFilter !== "all") params.set("niveau", niveauFilter);
    if (classeFilter !== "all") params.set("classe", classeFilter);
    if (periodeFilter !== "all") params.set("periode", periodeFilter);
    
    const queryString = params.toString();
    router.replace(`/bulletins${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [search, niveauFilter, classeFilter, periodeFilter, router]);

  const { data: bulletinsData, isLoading } = useBulletins({
    classeId: classeFilter !== "all" ? classeFilter : undefined,
    periodeId: periodeFilter !== "all" ? periodeFilter : undefined,
  });
  const { data: classesData } = useClasses();
  const { data: periodesData } = usePeriodes();

  const bulletins = bulletinsData?.data || [];
  const classes = classesData?.data || [];
  const periodes = periodesData?.data || [];
  const niveaux = [...new Set(classes.map((classe) => classe.niveau).filter(Boolean))];
  const classesFiltrees =
    niveauFilter === "all" ? classes : classes.filter((classe) => classe.niveau === niveauFilter);

  const filteredBulletins = bulletins.filter((b) => {
    const matchSearch =
      b.eleve.toLowerCase().includes(search.toLowerCase()) ||
      b.matricule.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (niveauFilter !== "all") {
      const classe = classes.find((item) => item.nom === b.classe);
      if (classe && classe.niveau !== niveauFilter) return false;
    }
    return true;
  });

  // Stats
  const stats = {
    total: bulletins.length,
    moyenneGenerale: bulletins.length > 0
      ? bulletins.filter(b => b.moyenne !== null).reduce((acc, b) => acc + (b.moyenne || 0), 0) / bulletins.filter(b => b.moyenne !== null).length
      : 0,
    tauxReussite: bulletins.length > 0
      ? Math.round((bulletins.filter((b) => (b.moyenne || 0) >= 10).length / bulletins.length) * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gestion des Bulletins" description="Générez et gérez les bulletins scolaires">
        <Link href="/bulletins/generer">
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Générer des bulletins</Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bulletins générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Période active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {periodeFilter !== "all" ? periodes.find(p => p.id === periodeFilter)?.nom : "Toutes"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne générale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.moyenneGenerale > 0 ? stats.moyenneGenerale.toFixed(2) : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.total > 0 ? `${stats.tauxReussite}%` : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/bulletins/generer">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />Générer par classe
              </CardTitle>
              <CardDescription>Générer tous les bulletins d&apos;une classe</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />Télécharger en lot
            </CardTitle>
            <CardDescription>Télécharger plusieurs bulletins en ZIP (bientôt)</CardDescription>
          </CardHeader>
        </Card>
        <Link href="/bulletins/verifier">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />Vérifier un bulletin
              </CardTitle>
              <CardDescription>Scanner ou entrer un code de vérification</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un élève..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select
              value={niveauFilter}
              onValueChange={(value) => {
                setNiveauFilter(value);
                setClasseFilter("all");
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {niveaux.map((niveau) => (
                  <SelectItem key={niveau} value={niveau}>
                    {niveau}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classeFilter} onValueChange={setClasseFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classesFiltrees.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                {periodes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulletins générés</CardTitle>
          <CardDescription>Liste des bulletins générés</CardDescription>
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
                    <TableHead>Élève</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Moyenne</TableHead>
                    <TableHead>Rang</TableHead>
                    <TableHead>Mention</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBulletins.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.eleve}</TableCell>
                      <TableCell><Badge variant="outline">{b.classe}</Badge></TableCell>
                      <TableCell>{b.periode}</TableCell>
                      <TableCell className="font-bold">{b.moyenne !== null ? b.moyenne.toFixed(2) : "-"}</TableCell>
                      <TableCell>{b.rang !== null ? `${b.rang}e` : "-"}</TableCell>
                      <TableCell>
                        {b.mention ? (
                          <Badge className={mentionColors[b.mention] || "bg-gray-100 text-gray-700"}>{b.mention}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{new Date(b.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/bulletins/${b.id}`}>
                                <Eye className="h-4 w-4 mr-2" />Voir le bulletin
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <span className="cursor-pointer">
                                <DownloadBulletinButton
                                  eleveId={b.eleveId}
                                  periodeId={b.periodeId}
                                  eleveName={b.eleve}
                                  variant="dropdown"
                                />
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredBulletins.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  {bulletins.length === 0 
                    ? "Aucun bulletin généré. Cliquez sur \"Générer des bulletins\" pour commencer."
                    : "Aucun bulletin trouvé pour cette recherche."}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
