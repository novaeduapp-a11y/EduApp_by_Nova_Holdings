"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Note {
  id: string;
  valeur: number;
  noteMax: number;
  evaluation: string;
  type: string;
  date: string;
  matiere: string;
  periode: string;
}

interface MoyenneMatiere {
  matiere: string;
  moyenne: number;
  periode: string;
}

interface MoyenneGenerale {
  moyenne: number;
  rang: number;
  mention: string;
  periode: string;
}

interface NotesData {
  notes: Note[];
  moyennesMatieres: MoyenneMatiere[];
  moyennesGenerales: MoyenneGenerale[];
}

export default function EleveNotesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["eleve-notes"],
    queryFn: async () => {
      const response = await apiGet<NotesData>("/eleve/notes");
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

  const { notes = [], moyennesMatieres = [], moyennesGenerales = [] } = data || {};

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
            <BookOpen className="h-6 w-6" />
            Mes Notes
          </h1>
          <p className="text-muted-foreground">Consulte tes résultats scolaires</p>
        </div>
      </div>

      {/* Moyennes Générales */}
      {moyennesGenerales.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {moyennesGenerales.map((mg, index) => (
            <Card key={index} className={index === 0 ? "border-green-500 border-2" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{mg.periode}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Number(mg.moyenne).toFixed(2)}/20</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">Rang: {mg.rang}e</Badge>
                  <Badge className={
                    mg.mention === "Très Bien" ? "bg-green-500" :
                    mg.mention === "Bien" ? "bg-blue-500" :
                    mg.mention === "Assez Bien" ? "bg-yellow-500" :
                    "bg-gray-500"
                  }>
                    {mg.mention || "Passable"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Moyennes par Matière */}
      {moyennesMatieres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Moyennes par Matière</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matière</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Moyenne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moyennesMatieres.map((mm, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{mm.matiere}</TableCell>
                    <TableCell>{mm.periode}</TableCell>
                    <TableCell className="text-right">
                      <span className={
                        Number(mm.moyenne) >= 16 ? "text-green-600 font-bold" :
                        Number(mm.moyenne) >= 10 ? "text-blue-600" :
                        "text-red-600"
                      }>
                        {Number(mm.moyenne).toFixed(2)}/20
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Détail des Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune note enregistrée pour le moment
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Évaluation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{new Date(note.date).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell className="font-medium">{note.matiere}</TableCell>
                    <TableCell>{note.evaluation}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{note.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        note.valeur >= note.noteMax * 0.8 ? "text-green-600 font-bold" :
                        note.valeur >= note.noteMax * 0.5 ? "text-blue-600" :
                        "text-red-600"
                      }>
                        {note.valeur}/{note.noteMax}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
