"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useClasses } from "@/hooks/use-classes";
import { usePeriodes } from "@/hooks/use-notes";

// Données de démo pour les moyennes
const moyennesDemo = [
  { id: "1", eleve: "Moussa Diallo", matricule: "2025CM1001", francais: 14.5, calcul: 16, sciences: 13, histoire: 15, moyenne: 14.63, rang: 2 },
  { id: "2", eleve: "Fatou Ndiaye", matricule: "2025CM1002", francais: 17, calcul: 15.5, sciences: 16, histoire: 14, moyenne: 15.63, rang: 1 },
  { id: "3", eleve: "Amadou Fall", matricule: "2025CM1003", francais: 12, calcul: 11, sciences: 13.5, histoire: 12, moyenne: 12.13, rang: 4 },
  { id: "4", eleve: "Aminata Sow", matricule: "2025CM1004", francais: 13, calcul: 14, sciences: 12, histoire: 13.5, moyenne: 13.13, rang: 3 },
  { id: "5", eleve: "Ibrahima Ba", matricule: "2025CM1005", francais: 10, calcul: 9.5, sciences: 11, histoire: 10, moyenne: 10.13, rang: 5 },
];

const getMentionColor = (moyenne: number) => {
  if (moyenne >= 16) return "bg-green-100 text-green-700";
  if (moyenne >= 14) return "bg-blue-100 text-blue-700";
  if (moyenne >= 12) return "bg-cyan-100 text-cyan-700";
  if (moyenne >= 10) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const getMention = (moyenne: number) => {
  if (moyenne >= 16) return "Très Bien";
  if (moyenne >= 14) return "Bien";
  if (moyenne >= 12) return "Assez Bien";
  if (moyenne >= 10) return "Passable";
  return "Insuffisant";
};

export default function MoyennesPage() {
  const router = useRouter();
  const [classeId, setClasseId] = useState<string>("");
  const [niveau, setNiveau] = useState<string>("");
  const [periodeId, setPeriodeId] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: classesData } = useClasses();
  const { data: periodesData } = usePeriodes();

  const classes = classesData?.data || [];
  const periodes = periodesData?.data || [];
  const niveaux = [...new Set(classes.map((classe) => classe.niveau).filter(Boolean))];
  const classesFiltrees = niveau ? classes.filter((classe) => classe.niveau === niveau) : classes;

  const filteredMoyennes = moyennesDemo.filter((m) =>
    m.eleve.toLowerCase().includes(search.toLowerCase()) ||
    m.matricule.toLowerCase().includes(search.toLowerCase())
  );

  const moyenneClasse = moyennesDemo.reduce((acc, m) => acc + m.moyenne, 0) / moyennesDemo.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Moyennes" description="Consultez les moyennes par classe et par période">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Retour
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />Exporter
          </Button>
        </div>
      </PageHeader>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un élève..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={niveau}
              onValueChange={(value) => {
                setNiveau(value === "all" ? "" : value);
                setClasseId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {niveaux.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classeId} onValueChange={setClasseId}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classesFiltrees.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodeId} onValueChange={setPeriodeId}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                {periodes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Calculator className="h-4 w-4 mr-2" />Calculer les moyennes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne de classe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{moyenneClasse.toFixed(2)}/20</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meilleure moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{Math.max(...moyennesDemo.map((m) => m.moyenne)).toFixed(2)}/20</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plus faible moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{Math.min(...moyennesDemo.map((m) => m.moyenne)).toFixed(2)}/20</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((moyennesDemo.filter((m) => m.moyenne >= 10).length / moyennesDemo.length) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des moyennes */}
      <Card>
        <CardHeader>
          <CardTitle>Tableau des moyennes</CardTitle>
          <CardDescription>CM1-A - 1er Trimestre 2025-2026</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rang</TableHead>
                <TableHead>Élève</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead className="text-center">Français</TableHead>
                <TableHead className="text-center">Calcul</TableHead>
                <TableHead className="text-center">Sciences</TableHead>
                <TableHead className="text-center">Histoire</TableHead>
                <TableHead className="text-center">Moyenne</TableHead>
                <TableHead>Mention</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMoyennes.sort((a, b) => a.rang - b.rang).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-bold">{m.rang}</TableCell>
                  <TableCell className="font-medium">{m.eleve}</TableCell>
                  <TableCell><code className="text-sm">{m.matricule}</code></TableCell>
                  <TableCell className="text-center">{m.francais.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{m.calcul.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{m.sciences.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{m.histoire.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-bold">{m.moyenne.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getMentionColor(m.moyenne)}>{getMention(m.moyenne)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
