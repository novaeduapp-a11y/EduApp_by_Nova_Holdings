"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Eleve = { id: string; nom: string; prenom: string; classe: { nom: string } };
type Bulletin = { id: string; eleve: string; classe: string; periode: string; date: string };
type Periode = { id: string; nom: string; actif: boolean };

export default function PrefetBulletinsPage() {
  const { toast } = useToast();
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [eleveId, setEleveId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [e, b] = await Promise.all([
      fetch("/api/staff/prefet/eleves").then((r) => r.json()),
      fetch("/api/staff/prefet/bulletins").then((r) => r.json()),
    ]);
    const list = (e.data ?? []) as Eleve[];
    setEleves(list);
    setEleveId((current) => current || list[0]?.id || "");
    setBulletins(b.data?.bulletins ?? []);
    const pers = (b.data?.periodes ?? []) as Periode[];
    setPeriodes(pers);
    const active = pers.find((p) => p.actif) ?? pers[0];
    setPeriodeId((current) => current || active?.id || "");
  };

  useEffect(() => {
    load().catch(() => toast({ variant: "destructive", title: "Impossible de charger les bulletins" }));
  }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/bulletins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eleveId, periodeId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Bulletin généré" });
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Génération impossible",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulletins</h1>
        <p className="text-muted-foreground">Uniquement les élèves de votre cycle.</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <select className="h-10 rounded-md border px-3 min-w-[200px]" value={eleveId} onChange={(e) => setEleveId(e.target.value)}>
            {eleves.map((eleve) => (
              <option key={eleve.id} value={eleve.id}>
                {eleve.prenom} {eleve.nom} · {eleve.classe.nom}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border px-3" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)}>
            {periodes.map((periode) => (
              <option key={periode.id} value={periode.id}>
                {periode.nom}
              </option>
            ))}
          </select>
          <Button onClick={generate} disabled={busy || !eleveId}>
            Générer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Élève</th>
                <th>Classe</th>
                <th>Période</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map((bulletin) => (
                <tr key={bulletin.id} className="border-b last:border-0">
                  <td className="py-2">{bulletin.eleve}</td>
                  <td>{bulletin.classe}</td>
                  <td>{bulletin.periode}</td>
                  <td>
                    <a className="text-[#1A5FD4] font-medium" href={`/api/staff/prefet/bulletins/${bulletin.id}/pdf`} target="_blank" rel="noreferrer">
                      Ouvrir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bulletins.length === 0 ? <p className="text-muted-foreground py-6 text-center">Aucun bulletin généré dans ce cycle.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
