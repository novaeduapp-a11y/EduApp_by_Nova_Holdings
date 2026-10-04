"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, CalendarDays, ClipboardList, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  portalCardClass,
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Accueil = {
  typeProfesseur: "MATIERE" | "PRIMAIRE" | null;
  ecole: { nom: string; ville: string } | null;
  totalClasses: number;
  totalEleves: number;
  totalEvaluations: number;
  evaluationsEnAttente: number;
  classes: { id: string; nom: string; niveau: string; effectif: number; matieres: string[] }[];
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

export default function ProfesseurHome() {
  const { data: session } = useSession();
  const [data, setData] = useState<Accueil | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/prof/accueil");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setData(body.data);
      setStatus("ready");
    } catch {
      setData(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const prenom = session?.user?.prenom ?? "";
  const typeLabel = data?.typeProfesseur === "PRIMAIRE" ? "Instituteur" : "Espace professeur";
  const classesPreview = (data?.classes ?? []).slice(0, 6);

  const kpis = data
    ? [
        {
          href: "/professeur/classes",
          icon: Users,
          value: data.totalClasses,
          label: data.totalClasses > 1 ? "classes" : "classe",
          tint: "bg-secondary text-primary",
        },
        {
          href: "/professeur/appel",
          icon: TrendingUp,
          value: data.totalEleves,
          label: data.totalEleves > 1 ? "élèves" : "élève",
          tint: "bg-[#E8F0FE] text-primary",
        },
        {
          href: "/professeur/notes",
          icon: ClipboardList,
          value: data.totalEvaluations,
          label: data.totalEvaluations > 1 ? "évaluations" : "évaluation",
          tint: "bg-muted text-foreground",
        },
        {
          href: "/professeur/notes",
          icon: BookOpen,
          value: data.evaluationsEnAttente,
          label: data.evaluationsEnAttente > 1 ? "notes à saisir" : "note à saisir",
          tint: "bg-destructive/10 text-destructive",
        },
      ]
    : [];

  const actions = [
    {
      href: "/professeur/notes",
      icon: BookOpen,
      title: "Saisir des notes",
      detail: "Entrez les notes de vos évaluations.",
    },
    {
      href: "/professeur/notes?creer=1",
      icon: ClipboardList,
      title: "Créer une évaluation",
      detail: "Planifiez un devoir ou une composition.",
    },
    {
      href: "/professeur/appel",
      icon: CalendarDays,
      title: "Faire l’appel",
      detail: "Présent, absent ou en retard.",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">{typeLabel}</p>
        <h1 className="mt-1 text-balance text-[30px] font-bold leading-9 tracking-tight">
          {prenom ? `Bonjour, ${prenom}` : "Bonjour"}
        </h1>
        <p className={`${portalMutedClass} mt-1 max-w-xl`}>
          Gérez vos classes, saisissez les notes et suivez la progression de vos élèves.
        </p>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger l’accueil.</p>
          <Button type="button" onClick={load}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`${portalCardClass} flex items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${kpi.tint}`}>
                <kpi.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-bold tabular-nums tracking-tight text-foreground">{kpi.value}</span>
                <span className={portalMutedClass}>{kpi.label}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {status === "loading" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${portalCardClass} flex flex-col items-center p-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <action.icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 className={`${portalTitleClass} mt-3`}>{action.title}</h2>
              <p className={`${portalMutedClass} mt-1`}>{action.detail}</p>
            </Link>
          ))}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">Mes classes</h2>
          <Link href="/professeur/classes" className={`text-sm ${portalLinkClass}`}>
            Voir tout
          </Link>
        </div>
        {status === "loading" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : classesPreview.length === 0 ? (
          <div className={`${portalPanelClass} py-10 text-center`}>
            <p className="font-medium text-foreground">Aucune classe affectée</p>
            <p className={`${portalMutedClass} mt-1`}>
              Le préfet doit vous affecter une matière avant de saisir notes et appel.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classesPreview.map((classe) => (
              <Link
                key={classe.id}
                href={`/professeur/classes/${classe.id}`}
                className={`${portalCardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              >
                <p className={portalTitleClass}>{classe.nom}</p>
                <p className={`${portalMutedClass} mt-1`}>
                  {classe.niveau} · {plural(classe.effectif, "élève", "élèves")}
                </p>
                <p className="mt-2 text-sm font-medium text-primary">{classe.matieres.join(" · ") || "—"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
