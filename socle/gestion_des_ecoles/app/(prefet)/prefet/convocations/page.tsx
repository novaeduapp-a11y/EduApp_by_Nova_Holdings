"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { portalMutedClass, portalPanelClass } from "@/components/eduadmins/portal-shell";

type Classe = { id: string; nom: string; niveau: string };
type Eleve = { id: string; prenom: string; nom: string };
type Convocation = {
  id: string;
  dateConvocation: string;
  motif: string;
  nomTuteur: string | null;
  eleve: string;
  classe: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function PrefetConvocationsPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [convocations, setConvocations] = useState<Convocation[]>([]);
  const [classeId, setClasseId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dateConvocation, setDateConvocation] = useState("");
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async (nextClasse = classeId) => {
    const [c, e] = await Promise.all([
      fetch("/api/staff/prefet/convocations"),
      nextClasse ? fetch("/api/staff/prefet/eleves") : Promise.resolve(null),
    ]);
    const convBody = await c.json();
    if (!c.ok) throw new Error(convBody.error);
    setClasses(convBody.data?.classes ?? []);
    setConvocations(convBody.data?.convocations ?? []);
    if (!classeId && convBody.data?.classes?.[0]?.id) {
      setClasseId(convBody.data.classes[0].id);
    }
    if (e) {
      const elevesBody = await e.json();
      const list = ((elevesBody.data ?? []) as { id: string; prenom: string; nom: string; classe: { id: string } }[]).filter(
        (item) => item.classe.id === nextClasse
      );
      setEleves(list);
    }
  };

  useEffect(() => {
    load().catch(() => toast({ variant: "destructive", title: "Impossible de charger les convocations" }));
  }, []);

  useEffect(() => {
    if (!classeId) return;
    setSelected([]);
    fetch("/api/staff/prefet/eleves")
      .then((res) => res.json())
      .then((body) => {
        const list = ((body.data ?? []) as { id: string; prenom: string; nom: string; classe: { id: string } }[]).filter(
          (item) => item.classe.id === classeId
        );
        setEleves(list);
      })
      .catch(() => {});
  }, [classeId]);

  const historique = useMemo(
    () => (classeId ? convocations.filter((row) => classes.find((c) => c.id === classeId)?.nom === row.classe) : convocations),
    [convocations, classeId, classes]
  );

  const envoyer = async () => {
    if (!classeId || selected.length === 0 || !dateConvocation || motif.trim().length < 4) {
      toast({ variant: "destructive", title: "Classe, élèves, date et motif sont requis" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/staff/prefet/convocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId,
          eleveIds: selected,
          dateConvocation,
          motif: motif.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: `${body.data.count} convocation${body.data.count > 1 ? "s" : ""} envoyée${body.data.count > 1 ? "s" : ""}` });
      setMotif("");
      setSelected([]);
      await load(classeId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Envoi refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Convocations</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Choisissez la classe, les élèves, la date et le motif. Le tuteur reçoit l’avis dans EduParent.
        </p>
      </div>

      <section className={`${portalPanelClass} space-y-4`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Classe">
            <select className="edu-select w-full" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date et heure">
            <Input type="datetime-local" value={dateConvocation} onChange={(e) => setDateConvocation(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Motif">
              <Input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Retards répétés, conseil de discipline…" />
            </Field>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Élèves</p>
          <div className="mb-2 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelected(eleves.map((e) => e.id))}>
              Toute la classe
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
              Vider
            </Button>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-border p-3">
            {eleves.map((eleve) => (
              <li key={eleve.id}>
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(eleve.id)}
                    onChange={() => toggle(eleve.id)}
                  />
                  {eleve.prenom} {eleve.nom}
                </label>
              </li>
            ))}
            {eleves.length === 0 ? <li className={portalMutedClass}>Aucun élève dans cette classe.</li> : null}
          </ul>
        </div>
        <Button type="button" onClick={envoyer} disabled={busy}>
          {busy ? "Envoi…" : "Envoyer sur EduParent"}
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Registre</h2>
        {historique.length === 0 ? (
          <p className={portalMutedClass}>Aucune convocation pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {historique.map((row) => (
              <li key={row.id} className={`${portalPanelClass} text-sm`}>
                <p className="font-semibold">
                  {row.eleve} · {row.classe}
                </p>
                <p className="text-muted-foreground">
                  {new Date(row.dateConvocation).toLocaleString("fr-FR")}
                  {row.nomTuteur ? ` · ${row.nomTuteur}` : ""}
                </p>
                <p className="mt-1">{row.motif}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
