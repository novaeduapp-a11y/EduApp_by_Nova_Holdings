"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MENTIONS } from "@/lib/constants";
import {
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Params = Record<string, string>;

type Periode = {
  id: string;
  nom: string;
  numero: number;
  dateDebut: string;
  dateFin: string;
  anneeScolaire: string;
  actif: boolean;
};

const SOLUTIONS = [
  {
    nom: "EduParent",
    texte: "Application mobile parents : notes, absences, bulletins, EDT, messages.",
  },
  {
    nom: "Espace parent web",
    texte: "Même consultation sur le site, pour un parent sans l’app.",
  },
  {
    nom: "EduAdmins — Direction",
    texte: "Bilan du jour, personnel, communiqués, agenda.",
  },
  {
    nom: "EduAdmins — Préfet",
    texte: "Élèves, classes, EDT, bulletins, communiqués de cycle.",
  },
  {
    nom: "EduAdmins — Professeur",
    texte: "Classes, notes, appel, planning, messagerie parents.",
  },
  {
    nom: "Administration NOVA",
    texte: "Établissements, comptes staff, paramètres globaux, journal.",
  },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className={portalMutedClass}>{hint}</p> : null}
    </div>
  );
}

export default function AdminParametresPage() {
  const { toast } = useToast();
  const [params, setParams] = useState<Params>({});
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const [p, per] = await Promise.all([
        fetch("/api/admin/parametres").then((res) => res.json()),
        fetch("/api/admin/periodes").then((res) => res.json()),
      ]);
      if (p.error) throw new Error(p.error);
      if (per.error) throw new Error(per.error);
      setParams(p.data ?? {});
      setPeriodes(per.data ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const set = (cle: string, valeur: string) => setParams((current) => ({ ...current, [cle]: valeur }));

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/parametres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parametres: params }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title: "Paramètres enregistrés", description: "Valables pour toutes les solutions EduApps." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enregistrement refusé",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const setPeriode = async (periode: Periode, actif: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/periodes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: periode.id, actif }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({
        title: actif ? "Période activée" : "Période désactivée",
        description: periode.nom,
      });
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Période refusée",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Paramètres</h1>
          <p className={`${portalMutedClass} mt-1`}>
            Réglages communs à EduParent, EduAdmins et le socle. L’identité d’un établissement se gère dans{" "}
            <Link href="/dashboard/ecoles" className={portalLinkClass}>
              Établissements
            </Link>
            .
          </p>
        </div>
        <Button type="button" onClick={save} disabled={busy || status !== "ready"}>
          Enregistrer
        </Button>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les paramètres.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">Solutions</h2>
            <p className={`${portalMutedClass} mt-1`}>Couverture actuelle du forfait V1.1 — pas un interrupteur de coupure.</p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {SOLUTIONS.map((item) => (
                <li key={item.nom} className="rounded-2xl bg-muted px-4 py-3">
                  <p className="font-medium text-foreground">{item.nom}</p>
                  <p className={`${portalMutedClass} mt-1`}>{item.texte}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">Plateforme</h2>
            <p className={`${portalMutedClass} mt-1 mb-4`}>Nom affiché et contact support NOVA, pour toutes les écoles.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom de la plateforme">
                <Input value={params.nom_plateforme ?? ""} onChange={(e) => set("nom_plateforme", e.target.value)} />
              </Field>
              <Field label="Année scolaire">
                <Input value={params.annee_scolaire ?? ""} onChange={(e) => set("annee_scolaire", e.target.value)} />
              </Field>
              <Field label="E-mail support">
                <Input type="email" value={params.support_email ?? ""} onChange={(e) => set("support_email", e.target.value)} />
              </Field>
              <Field label="Téléphone support">
                <Input value={params.support_telephone ?? ""} onChange={(e) => set("support_telephone", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">Périodes</h2>
            <p className={`${portalMutedClass} mt-1 mb-4`}>
              Une seule période active à la fois : notes, moyennes et accueil parent s’appuient dessus.
            </p>
            {periodes.length === 0 ? (
              <p className={portalMutedClass}>Aucune période en base.</p>
            ) : (
              <ul className="space-y-2">
                {periodes.map((periode) => (
                  <li key={periode.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{periode.nom}</p>
                      <p className={portalMutedClass}>
                        {periode.anneeScolaire} · du{" "}
                        {new Date(`${periode.dateDebut}T12:00:00`).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(`${periode.dateFin}T12:00:00`).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
                      <Switch
                        checked={periode.actif}
                        disabled={busy}
                        onCheckedChange={(checked) => void setPeriode(periode, checked)}
                      />
                      {periode.actif ? "Active" : "Inactive"}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">Notation</h2>
            <p className={`${portalMutedClass} mt-1 mb-4`}>Barème commun aux portails professeur, préfet, parent et bulletins.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Note maximale par défaut">
                <Input type="number" value={params.note_max ?? "20"} onChange={(e) => set("note_max", e.target.value)} />
              </Field>
              <Field label="Moyenne de passage">
                <Input type="number" value={params.moyenne_passage ?? "10"} onChange={(e) => set("moyenne_passage", e.target.value)} />
              </Field>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.values(MENTIONS).map((mention) => (
                <li key={mention.label} className="flex justify-between rounded-2xl bg-muted px-4 py-2 text-sm">
                  <span>{mention.label}</span>
                  <span className="tabular-nums text-muted-foreground">≥ {mention.min}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">Notifications</h2>
            <p className={`${portalMutedClass} mt-1 mb-4`}>
              Les alertes in-app fonctionnent (EduParent et EduAdmins). E-mail et SMS ne sont pas encore envoyés.
            </p>
            <div className="space-y-3">
              {(
                [
                  ["notif_absences", "Alertes absences", "Les parents voient les absences dans l’app et les alertes."],
                  ["notif_rappel_notes", "Alertes notes / communiqués", "Notes, bulletins et communiqués dans le fil d’alertes."],
                  ["notif_email", "E-mail", "Envoi via Resend (codes 2FA, notifications). Domaine eduadmin.net."],
                  ["notif_sms", "SMS", "Non branché. Resend gère l’e-mail uniquement — prévoir un opérateur SMS (Twilio, etc.)."],
                ] as const
              ).map(([cle, titre, hint]) => (
                <label key={cle} className="flex min-h-11 items-center justify-between gap-4 rounded-2xl bg-muted px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-foreground">{titre}</span>
                    <span className={portalMutedClass}>{hint}</span>
                  </span>
                  <Switch
                    checked={params[cle] === "true"}
                    onCheckedChange={(checked) => set(cle, checked ? "true" : "false")}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className={portalPanelClass}>
            <h2 className="font-bold tracking-tight text-foreground">En-tête bulletins (pilote)</h2>
            <p className={`${portalMutedClass} mt-1 mb-4`}>
              Texte imprimé sur les PDF tant que l’identité n’est pas lue depuis chaque établissement.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom">
                <Input value={params.nom_etablissement ?? ""} onChange={(e) => set("nom_etablissement", e.target.value)} />
              </Field>
              <Field label="Téléphone">
                <Input value={params.telephone_etablissement ?? ""} onChange={(e) => set("telephone_etablissement", e.target.value)} />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={params.email_etablissement ?? ""} onChange={(e) => set("email_etablissement", e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Adresse">
                  <Textarea
                    rows={2}
                    value={params.adresse_etablissement ?? ""}
                    onChange={(e) => set("adresse_etablissement", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
