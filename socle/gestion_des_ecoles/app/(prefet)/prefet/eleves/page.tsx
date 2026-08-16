"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Classe = { id: string; nom: string; niveau: string };
type Eleve = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  nomTuteur: string | null;
  telephoneTuteur: string | null;
  classe: { nom: string; niveau: string };
};

export default function PrefetElevesPage() {
  const { toast } = useToast();
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    sexe: "M",
    classeId: "",
    nomTuteur: "",
    telephoneTuteur: "",
    emailParent: "",
  });

  const load = async () => {
    const [e, c] = await Promise.all([
      fetch("/api/staff/prefet/eleves").then((r) => r.json()),
      fetch("/api/staff/prefet/classes").then((r) => r.json()),
    ]);
    setEleves(e.data ?? []);
    const list = (c.data?.classes ?? []) as Classe[];
    setClasses(list);
    setForm((prev) => ({ ...prev, classeId: prev.classeId || list[0]?.id || "" }));
  };

  useEffect(() => {
    load().catch(() => toast({ variant: "destructive", title: "Impossible de charger les élèves" }));
  }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/eleves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: `Inscrit · ${body.data.matricule}` });
      setOpen(false);
      setForm((prev) => ({ ...prev, nom: "", prenom: "", dateNaissance: "", nomTuteur: "", telephoneTuteur: "" }));
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Inscription refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Élèves</h1>
          <p className="text-muted-foreground">Uniquement le cycle du préfet connecté.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>{open ? "Fermer" : "Nouvelle inscription"}</Button>
      </div>

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <Label>Prénom</Label>
              <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} />
            </div>
            <div>
              <Label>Sexe</Label>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={form.sexe}
                onChange={(e) => setForm({ ...form, sexe: e.target.value })}
              >
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
            <div>
              <Label>Classe (cycle)</Label>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={form.classeId}
                onChange={(e) => setForm({ ...form, classeId: e.target.value })}
              >
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} · {classe.niveau}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tuteur</Label>
              <Input value={form.nomTuteur} onChange={(e) => setForm({ ...form, nomTuteur: e.target.value })} />
            </div>
            <div>
              <Label>Téléphone tuteur</Label>
              <Input value={form.telephoneTuteur} onChange={(e) => setForm({ ...form, telephoneTuteur: e.target.value })} />
            </div>
            <div>
              <Label>E-mail parent (optionnel)</Label>
              <Input value={form.emailParent} onChange={(e) => setForm({ ...form, emailParent: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={submit} disabled={busy}>
                {busy ? "Enregistrement..." : "Inscrire"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Matricule</th>
                <th>Élève</th>
                <th>Classe</th>
                <th>Tuteur</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map((eleve) => (
                <tr key={eleve.id} className="border-b last:border-0">
                  <td className="py-2 font-mono">{eleve.matricule}</td>
                  <td>
                    {eleve.prenom} {eleve.nom}
                  </td>
                  <td>{eleve.classe.nom}</td>
                  <td>
                    {eleve.nomTuteur ?? "—"}
                    {eleve.telephoneTuteur ? ` · ${eleve.telephoneTuteur}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {eleves.length === 0 ? <p className="text-muted-foreground py-6 text-center">Aucun élève dans ce cycle.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
