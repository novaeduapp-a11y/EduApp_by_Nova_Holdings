"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  portalCardClass,
  portalKpiClass,
  portalLinkClass,
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Mention = { label: string; value: number };
type Cycle = { famille: string; label: string; classes: number; eleves: number };

type Apercu = {
  ecole: { nom: string; ville: string } | null;
  totalEleves: number;
  totalClasses: number;
  totalProfesseurs: number;
  periode: { nom: string; numero: number } | null;
  moyenneGenerale: number | null;
  elevesEvalues: number;
  elevesDifficulte: number;
  tauxPresence: number | null;
  absencesJour: number;
  retardsJour: number;
  totalCommuniques: number;
  cycles: Cycle[];
  mentions: Mention[];
};

const MENTION_COLORS: Record<string, string> = {
  "Très Bien": "#0B2F7A",
  Bien: "#1A5FD4",
  "Assez Bien": "#3D7AE8",
  Passable: "#3D6FBF",
  Insuffisant: "#C62828",
};

function formatMoyenne(value: number) {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; color?: string }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="rounded-2xl bg-card px-3 py-2 text-sm shadow-card">
      <p className="font-semibold text-foreground">{label ?? row.name}</p>
      <p className="tabular-nums text-muted-foreground">
        {row.value} {suffix}
      </p>
    </div>
  );
}

export default function DirecteurApercuPage() {
  const [data, setData] = useState<Apercu | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reduceMotion, setReduceMotion] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/direction/apercu");
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

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const mentionsActives = (data?.mentions ?? []).filter((item) => item.value > 0);
  const moyenneLabel = data?.moyenneGenerale != null ? formatMoyenne(data.moyenneGenerale) : "—";
  const moyenneDetail =
    data?.moyenneGenerale != null
      ? `${data.elevesDifficulte} élève${data.elevesDifficulte > 1 ? "s" : ""} sous 10${data.periode ? ` · ${data.periode.nom}` : ""}`
      : data?.periode
        ? `Notes pas encore consolidées · ${data.periode.nom}`
        : "Aucune période active.";

  const kpis = data
    ? [
        {
          href: "#cycles",
          value: data.totalEleves,
          title: "Élèves",
          detail: "Effectif actif de l’établissement.",
        },
        {
          href: "#cycles",
          value: data.totalClasses,
          title: "Classes",
          detail: "Tous cycles confondus.",
        },
        {
          href: "/directeur/personnel",
          value: data.totalProfesseurs,
          title: "Professeurs",
          detail: "Présence du jour sur Personnel.",
        },
        {
          href: "#mentions",
          value: moyenneLabel,
          title: "Moyenne",
          detail: moyenneDetail,
        },
        {
          href: "/directeur",
          value: data.tauxPresence != null ? `${data.tauxPresence} %` : "—",
          title: "Présence du jour",
          detail: `${data.absencesJour} absence${data.absencesJour > 1 ? "s" : ""} · ${data.retardsJour} retard${data.retardsJour > 1 ? "s" : ""}`,
        },
        {
          href: "/directeur/communiques",
          value: data.totalCommuniques,
          title: "Communiqués",
          detail: "Parents et professeurs de l’école.",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Aperçu</h1>
        <p className={`${portalMutedClass} mt-1 max-w-2xl`}>
          {data?.ecole ? `${data.ecole.nom} · ${data.ecole.ville}` : "Agrégats de votre école uniquement."}
          {data?.periode ? ` · ${data.periode.nom}` : ""}
          {" · "}
          La présence du jour compte les absences élèves, hors retards.{" "}
          <Link href="/directeur" className={portalLinkClass}>
            Ouvrir le bilan
          </Link>
        </p>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger l’aperçu.</p>
          <Button type="button" onClick={load}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <Link
              key={kpi.title}
              href={kpi.href}
              className={`${portalCardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              <p className={portalKpiClass}>{kpi.value}</p>
              <h2 className={`${portalTitleClass} mt-1`}>{kpi.title}</h2>
              <p className={`${portalMutedClass} mt-1`}>{kpi.detail}</p>
            </Link>
          ))}
        </div>
      )}

      {status === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section id="cycles" className={portalPanelClass} aria-labelledby="chart-cycles">
            <h2 id="chart-cycles" className={portalTitleClass}>
              Élèves par cycle
            </h2>
            <p className={`${portalMutedClass} mt-1`}>Effectifs actifs, toute l’école.</p>
            <div
              className="mt-4 h-64 w-full"
              role="img"
              aria-label={data.cycles
                .map((row) => `${row.label} : ${row.eleves} élève${row.eleves > 1 ? "s" : ""}`)
                .join(". ")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.cycles} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#D7E2F5" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#5B6B86", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#5B6B86", fontSize: 12 }}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: "rgb(26 95 212 / 0.08)" }}
                    content={<ChartTooltip suffix="élèves" />}
                  />
                  <Bar
                    dataKey="eleves"
                    name="Élèves"
                    fill="#1A5FD4"
                    radius={[12, 12, 8, 8]}
                    maxBarSize={48}
                    isAnimationActive={!reduceMotion}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {data.cycles.map((cycle) => (
                <li key={cycle.famille} className="rounded-2xl bg-muted px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">{cycle.label}</p>
                  <p className={`${portalMutedClass} mt-0.5`}>
                    {cycle.eleves} élève{cycle.eleves > 1 ? "s" : ""} · {cycle.classes} classe
                    {cycle.classes > 1 ? "s" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section id="mentions" className={portalPanelClass} aria-labelledby="chart-mentions">
            <h2 id="chart-mentions" className={portalTitleClass}>
              Mentions
            </h2>
            <p className={`${portalMutedClass} mt-1`}>
              {data.periode
                ? `${data.elevesEvalues} élève${data.elevesEvalues > 1 ? "s" : ""} évalué${data.elevesEvalues > 1 ? "s" : ""} · ${data.periode.nom}`
                : "Aucune période active."}
            </p>
            {mentionsActives.length === 0 ? (
              <p className="mt-10 text-sm leading-6 text-muted-foreground">
                Les mentions apparaîtront quand les moyennes de la période seront calculées.
              </p>
            ) : (
              <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
                <div
                  className="h-56 w-full"
                  role="img"
                  aria-label={mentionsActives.map((row) => `${row.label} : ${row.value}`).join(". ")}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mentionsActives}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="none"
                        isAnimationActive={!reduceMotion}
                      >
                        {mentionsActives.map((row) => (
                          <Cell key={row.label} fill={MENTION_COLORS[row.label] ?? "#1A5FD4"} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 text-sm">
                  {data.mentions.map((row) => (
                    <li key={row.label} className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: MENTION_COLORS[row.label] }}
                          aria-hidden
                        />
                        <span className="truncate text-foreground">{row.label}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">{row.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
