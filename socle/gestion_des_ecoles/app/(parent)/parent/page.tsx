"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  portalChipClass,
  portalHeroClass,
  portalKpiClass,
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Enfant = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  photo: string | null;
  classe: string;
  cycle: string | null;
};

type Accueil = {
  notesRecentes: { id: string; valeur: number; matiere: string; evaluation: string }[];
  absences: { total: number; retards: number; nonJustifiees: number };
  moyenne: { valeur: number; periode: string; mention: string | null } | null;
  notificationsNonLues: number;
  coursDuJour: { id: string; matiere: string; horaire: string; salle: string | null }[];
};

type Alerte = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function formatNote(value: number) {
  return Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export default function ParentDashboard() {
  const { data: session } = useSession();
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [accueils, setAccueils] = useState<Record<string, Accueil>>({});
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = async () => {
    setStatus("loading");
    try {
      const [enfantsRes, alertesRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch("/api/parent/notifications"),
      ]);
      const enfantsBody = await enfantsRes.json();
      const alertesBody = await alertesRes.json();
      if (!enfantsRes.ok) throw new Error(enfantsBody.error);
      if (!alertesRes.ok) throw new Error(alertesBody.error);
      const list = (enfantsBody.data ?? []) as Enfant[];
      setEnfants(list);
      setAlertes(alertesBody.data ?? []);

      const pairs = await Promise.all(
        list.map(async (enfant) => {
          const res = await fetch(`/api/parent/enfants/${enfant.id}/accueil`);
          const body = await res.json();
          if (!res.ok) throw new Error(body.error);
          return [enfant.id, body.data as Accueil] as const;
        })
      );
      setAccueils(Object.fromEntries(pairs));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const absences = Object.values(accueils).reduce((sum, item) => sum + (item.absences?.total ?? 0), 0);
  const unread = alertes.filter((item) => !item.readAt).length;
  const moyennes = Object.values(accueils)
    .map((item) => item.moyenne?.valeur)
    .filter((value): value is number => typeof value === "number");
  const moyenneMoyenne =
    moyennes.length > 0 ? moyennes.reduce((sum, value) => sum + Number(value), 0) / moyennes.length : null;

  return (
    <div className="space-y-6">
      <section className={portalHeroClass}>
        <p className="text-sm font-medium text-white/80">EduParent</p>
        <h1 className="mt-1 text-balance text-[30px] font-bold leading-9 tracking-tight">
          Bonjour{session?.user?.prenom ? `, ${session.user.prenom}` : ""}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
          Notes, absences, bulletins et messages des professeurs de vos enfants.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/parent/messages">Messages</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <Link href="/parent/paiements">Paiements</Link>
          </Button>
        </div>
      </section>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger l’accueil.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/parent" className={portalPanelClass}>
              <p className={portalMutedClass}>Enfants</p>
              <p className={`${portalKpiClass} mt-1`}>{enfants.length}</p>
            </Link>
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Moyenne</p>
              <p className={`${portalKpiClass} mt-1`}>
                {moyenneMoyenne == null ? "—" : `${formatNote(moyenneMoyenne)}/20`}
              </p>
            </div>
            <Link href={enfants[0] ? `/parent/enfant/${enfants[0].id}/absences` : "/parent"} className={portalPanelClass}>
              <p className={portalMutedClass}>Absences</p>
              <p className={`${portalKpiClass} mt-1`}>{absences}</p>
            </Link>
            <Link href="/parent/alertes" className={portalPanelClass}>
              <p className={portalMutedClass}>Alertes non lues</p>
              <p className={`${portalKpiClass} mt-1`}>{unread}</p>
            </Link>
          </div>

          {enfants.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className="font-medium text-foreground">Aucun enfant associé</p>
              <p className={`${portalMutedClass} mt-1`}>
                Contactez l’administration de l’école pour relier vos enfants à ce compte.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enfants.map((enfant) => {
                const accueil = accueils[enfant.id];
                return (
                  <article key={enfant.id} className={portalPanelClass}>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={enfant.photo || undefined} alt="" />
                        <AvatarFallback className="bg-secondary font-bold text-primary">
                          {initials(enfant.prenom, enfant.nom)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold tracking-tight">
                          {enfant.prenom} {enfant.nom}
                        </h2>
                        <p className={portalMutedClass}>
                          {enfant.classe}
                          {enfant.cycle ? ` · ${enfant.cycle}` : ""} · {enfant.matricule}
                        </p>
                        {accueil?.moyenne ? (
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {formatNote(Number(accueil.moyenne.valeur))}/20
                            {accueil.moyenne.mention ? ` · ${accueil.moyenne.mention}` : ""}
                            <span className="font-normal text-muted-foreground"> · {accueil.moyenne.periode}</span>
                          </p>
                        ) : (
                          <p className={`${portalMutedClass} mt-1`}>Aucune moyenne pour le moment.</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/parent/enfant/${enfant.id}/notes`} className={portalChipClass}>
                        Notes
                      </Link>
                      <Link href={`/parent/enfant/${enfant.id}/absences`} className={portalChipClass}>
                        Absences{accueil ? ` · ${accueil.absences.total}` : ""}
                      </Link>
                      <Link href={`/parent/enfant/${enfant.id}/bulletins`} className={portalChipClass}>
                        Bulletins
                      </Link>
                      <Link href={`/parent/enfant/${enfant.id}/edt`} className={portalChipClass}>
                        Emploi du temps
                      </Link>
                    </div>
                    {accueil?.coursDuJour && accueil.coursDuJour.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-foreground">Cours du jour</p>
                        <ul className="mt-2 space-y-1">
                          {accueil.coursDuJour.slice(0, 3).map((cours) => (
                            <li key={cours.id} className={portalMutedClass}>
                              {cours.horaire} · {cours.matiere}
                              {cours.salle ? ` · ${cours.salle}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <p className="mt-4">
                      <Link href={`/parent/enfant/${enfant.id}`} className={`text-sm ${portalLinkClass}`}>
                        Voir l’aperçu
                      </Link>
                    </p>
                  </article>
                );
              })}
            </div>
          )}

          <section className={portalPanelClass}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className={portalTitleClass}>Dernières alertes</h2>
              <Link href="/parent/alertes" className={`text-sm ${portalLinkClass}`}>
                Toutes
              </Link>
            </div>
            {alertes.length === 0 ? (
              <p className={portalMutedClass}>Aucune alerte pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {alertes.slice(0, 4).map((alerte) => (
                  <li key={alerte.id} className="rounded-2xl bg-muted px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{alerte.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{alerte.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
