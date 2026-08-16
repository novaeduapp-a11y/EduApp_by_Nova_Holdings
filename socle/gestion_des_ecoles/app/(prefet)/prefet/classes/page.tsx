"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Classe = {
  id: string;
  nom: string;
  niveau: string;
  effectif: number;
  effectifMax: number;
  cycle: string;
};

export default function PrefetClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch("/api/staff/prefet/classes");
    const body = await res.json();
    setClasses(body.data?.classes ?? []);
    const list = (body.data?.niveaux ?? []) as string[];
    setNiveaux(list);
    setNiveau((current) => current || list[0] || "");
  };

  useEffect(() => {
    load().catch(() => toast({ variant: "destructive", title: "Impossible de charger les classes" }));
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, niveau, effectifMax: 40 }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: `Classe ${body.data.nom} créée` });
      setNom("");
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Création refusée",
        description: error instanceof Error ? error.message : "Hors de votre cycle",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Classes</h1>
        <p className="text-muted-foreground">Un préfet collège ne peut pas créer un CM1.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle classe</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div>
            <Label>Nom</Label>
            <Input placeholder="5ème A" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div>
            <Label>Niveau</Label>
            <select className="h-10 rounded-md border px-3" value={niveau} onChange={(e) => setNiveau(e.target.value)}>
              {niveaux.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={create} disabled={busy || !nom}>
            Créer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Classe</th>
                <th>Niveau</th>
                <th>Effectif</th>
                <th>Cycle</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((classe) => (
                <tr key={classe.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{classe.nom}</td>
                  <td>{classe.niveau}</td>
                  <td>
                    {classe.effectif} / {classe.effectifMax}
                  </td>
                  <td>{classe.cycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {classes.length === 0 ? <p className="text-muted-foreground py-6 text-center">Aucune classe dans ce cycle.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
