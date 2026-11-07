"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { portalMutedClass, portalPanelClass } from "@/components/eduadmins/portal-shell";

type Detail = {
  id: string;
  nom: string;
  nomOfficiel: string | null;
  sigle: string | null;
  ville: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
  paiementAJour: boolean;
  montantMensuel: number | null;
  montantAnnuel: number | null;
  parCycle: { famille: string; label: string; ouvert: boolean; classes: number; eleves: number }[];
  effectifs: {
    eleves: number;
    directeurs: number;
    prefets: number;
    professeurs: number;
    classes: number;
  };
  classes: {
    id: string;
    nom: string;
    niveau: string;
    famille: string | null;
    eleves: number;
    deletedAt: string | null;
  }[];
};

function cfa(value: number | null) {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function AdminEcoleFichePage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [tarifOpen, setTarifOpen] = useState(false);
  const [tarifForm, setTarifForm] = useState({ mensuel: "", annuel: "" });

  const load = async () => {
    const res = await fetch(`/api/admin/ecoles/${params.id}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setDetail(body.data);
  };

  useEffect(() => {
    setStatus("loading");
    load()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, [params.id]);

  const patchEcole = async (payload: Record<string, unknown>, okTitle: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ecoles/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: okTitle });
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Mise à jour refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const openTarif = () => {
    if (!detail) return;
    setTarifForm({
      mensuel: detail.montantMensuel != null ? String(detail.montantMensuel) : "",
      annuel: detail.montantAnnuel != null ? String(detail.montantAnnuel) : "",
    });
    setTarifOpen(true);
  };

  const saveTarif = async () => {
    await patchEcole(
      {
        montantMensuel: tarifForm.mensuel ? Number(tarifForm.mensuel) : null,
        montantAnnuel: tarifForm.annuel ? Number(tarifForm.annuel) : null,
      },
      "Tarif mis à jour"
    );
    setTarifOpen(false);
  };

  const restoreClasse = async (classeId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ecoles/${params.id}/classes/${classeId}/restore`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Classe restaurée" });
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Restauration refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (status === "error" || !detail) {
    return (
      <div className={portalPanelClass}>
        <p>Impossible de charger cette fiche.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/ecoles">Retour</Link>
        </Button>
      </div>
    );
  }

  const annuel = detail.montantAnnuel ?? (detail.montantMensuel != null ? detail.montantMensuel * 10 : null);
  const classesActives = detail.classes.filter((c) => !c.deletedAt);
  const classesArchivees = detail.classes.filter((c) => c.deletedAt);

  const progression = [
    { label: "Établissement actif", ok: detail.actif },
    { label: "Compte direction", ok: detail.effectifs.directeurs > 0 },
    { label: "Compte préfecture", ok: detail.effectifs.prefets > 0 },
    { label: "Au moins une classe", ok: detail.effectifs.classes > 0 },
    { label: "Au moins un élève", ok: detail.effectifs.eleves > 0 },
    { label: "Tarif licence renseigné", ok: detail.montantMensuel != null || detail.montantAnnuel != null },
    { label: "Paiement à jour", ok: detail.paiementAJour },
  ];
  const progressionOk = progression.filter((item) => item.ok).length;
  const progressionPct = Math.round((progressionOk / progression.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-2">
          <Link href="/dashboard/ecoles">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Établissements
          </Link>
        </Button>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight uppercase">{detail.nom}</h1>
        <p className={portalMutedClass}>
          {detail.nomOfficiel || detail.nom} · {detail.ville}
          {detail.sigle ? ` · ${detail.sigle}` : ""}
        </p>
      </div>

      <section className={portalPanelClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Paramétrage</h2>
          <p className="text-sm font-medium tabular-nums text-foreground">{progressionPct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressionPct}%` }} />
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {progression.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              <span className={item.ok ? "text-emerald-600" : "text-muted-foreground"}>{item.ok ? "✓" : "○"}</span>
              <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${portalPanelClass} grid gap-3 sm:grid-cols-2`}>
        <p><span className="text-muted-foreground">Adresse</span><br />{detail.adresse || "—"}</p>
        <p><span className="text-muted-foreground">Téléphone</span><br />{detail.telephone || "—"}</p>
        <p><span className="text-muted-foreground">E-mail</span><br />{detail.email || "—"}</p>
        <p><span className="text-muted-foreground">Statut</span><br />{detail.actif ? "Actif" : "Inactif"}</p>
      </section>

      <section className={portalPanelClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">Licence NOVA</h2>
          <Button
            type="button"
            size="sm"
            className={
              detail.paiementAJour
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }
            disabled={busy}
            onClick={() =>
              void patchEcole(
                { paiementAJour: !detail.paiementAJour },
                detail.paiementAJour ? "Marqué impayé" : "Marqué à jour"
              )
            }
          >
            {detail.paiementAJour ? "À jour" : "Impayé"}
          </Button>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Mensuel</p>
            <p className="text-2xl font-bold tabular-nums">{cfa(detail.montantMensuel)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Annuel</p>
            <p className="text-2xl font-bold tabular-nums">{cfa(annuel)}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={openTarif} disabled={busy}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Modifier le tarif
        </Button>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Effectifs</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className={portalMutedClass}>Classes</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{detail.effectifs.classes}</p>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className={portalMutedClass}>Élèves</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{detail.effectifs.eleves}</p>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className={portalMutedClass}>Direction / préfecture</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {detail.effectifs.directeurs + detail.effectifs.prefets}
            </p>
            <p className={`${portalMutedClass} mt-1 text-xs`}>
              {detail.effectifs.directeurs} dir. · {detail.effectifs.prefets} préf.
            </p>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className={portalMutedClass}>Enseignants</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{detail.effectifs.professeurs}</p>
          </div>
        </div>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Cycles</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {detail.parCycle.map((cycle) => (
            <li key={cycle.famille} className="rounded-2xl bg-secondary/60 p-4">
              <p className="font-semibold">{cycle.label}</p>
              <p className={portalMutedClass}>{cycle.ouvert ? "Ouvert" : "Non ouvert"}</p>
              <p className="mt-2 text-sm tabular-nums">
                {cycle.classes} classe{cycle.classes > 1 ? "s" : ""} · {cycle.eleves} élève{cycle.eleves > 1 ? "s" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={portalPanelClass}>
        <h2 className="text-lg font-semibold">Classes</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {classesActives.map((classe) => (
            <li key={classe.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span>
                {classe.nom}
                {classe.niveau && classe.niveau !== classe.nom ? ` · ${classe.niveau}` : ""}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {classe.eleves} élève{classe.eleves > 1 ? "s" : ""}
              </span>
            </li>
          ))}
          {classesActives.length === 0 ? <li className={`py-2 ${portalMutedClass}`}>Aucune classe active.</li> : null}
        </ul>
        {classesArchivees.length > 0 ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className={`${portalMutedClass} mb-2 text-sm`}>Classes archivées</p>
            <ul className="divide-y divide-border text-sm">
              {classesArchivees.map((classe) => (
                <li key={classe.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <span className="text-muted-foreground">
                    {classe.nom}
                    {classe.niveau && classe.niveau !== classe.nom ? ` · ${classe.niveau}` : ""}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void restoreClasse(classe.id)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Restaurer
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <Dialog open={tarifOpen} onOpenChange={setTarifOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le tarif</DialogTitle>
            <DialogDescription>Montants de la licence NOVA pour cet établissement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tarif-mensuel">Mensuel (FCFA)</Label>
              <Input
                id="tarif-mensuel"
                type="number"
                min={0}
                value={tarifForm.mensuel}
                onChange={(e) => setTarifForm({ ...tarifForm, mensuel: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tarif-annuel">Annuel (FCFA)</Label>
              <Input
                id="tarif-annuel"
                type="number"
                min={0}
                value={tarifForm.annuel}
                onChange={(e) => setTarifForm({ ...tarifForm, annuel: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTarifOpen(false)} disabled={busy}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void saveTarif()} disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
