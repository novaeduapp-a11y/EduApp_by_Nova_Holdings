"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EleveToolbar } from "@/components/shared/eleve-toolbar";
import { uniqueNiveaux } from "@/lib/eleve-filter";
import { useToast } from "@/hooks/use-toast";
import {
  portalCardClass,
  portalKpiClass,
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Eleve = { id: string; nom: string; moyenne: number };
type ClasseBilan = {
  id: string;
  nom: string;
  niveau: string;
  effectif: number;
  evalues: number;
  moyenne: number | null;
  mentions: Record<string, number>;
  meilleurs: Eleve[];
  difficulte: Eleve[];
  sousDix: number;
};

const PAGE_SIZE = 30;

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
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="rounded-2xl bg-card px-3 py-2 text-sm shadow-card">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="tabular-nums text-muted-foreground">{formatMoyenne(payload[0].value)} / 20</p>
    </div>
  );
}

export default function PrefetBilanPage() {
  const { toast } = useToast();
  const [periode, setPeriode] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClasseBilan[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [page, setPage] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  const load = async () => {
    const res = await fetch("/api/staff/prefet/bilan");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setPeriode(body.data?.periode?.nom ?? null);
    setClasses(body.data?.classes ?? []);
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
      toast({ variant: "destructive", title: "Impossible de charger le bilan" });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const niveaux = useMemo(() => uniqueNiveaux(classes), [classes]);
  const classesFiltrees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((classe) => {
      if (filtreNiveau && classe.niveau !== filtreNiveau) return false;
      if (!q) return true;
      const eleves = [...classe.meilleurs, ...classe.difficulte].map((eleve) => eleve.nom.toLowerCase());
      return (
        classe.nom.toLowerCase().includes(q) ||
        classe.niveau.toLowerCase().includes(q) ||
        eleves.some((nom) => nom.includes(q))
      );
    });
  }, [classes, search, filtreNiveau]);

  const pageCount = Math.max(1, Math.ceil(classesFiltrees.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const classesPage = classesFiltrees.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = classesFiltrees.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, classesFiltrees.length);

  useEffect(() => {
    setPage(1);
  }, [search, filtreNiveau]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const evalues = classes.reduce((sum, classe) => sum + classe.evalues, 0);
  const sousDix = classes.reduce((sum, classe) => sum + (classe.sousDix ?? 0), 0);
  const moyenneCycle = useMemo(() => {
    let total = 0;
    let poids = 0;
    for (const classe of classes) {
      if (classe.moyenne == null || classe.evalues === 0) continue;
      total += classe.moyenne * classe.evalues;
      poids += classe.evalues;
    }
    return poids === 0 ? null : total / poids;
  }, [classes]);

  const chartData = classesFiltrees
    .filter((classe) => classe.moyenne != null)
    .map((classe) => ({ nom: classe.nom, moyenne: classe.moyenne as number }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Bilan trimestre</h1>
        <p className={`${portalMutedClass} mt-1`}>
          {periode
            ? `Moyennes et élèves en difficulté · ${periode} · votre cycle uniquement.`
            : "Aucune période active. Le bilan apparaîtra dès qu’un trimestre sera ouvert."}
        </p>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher une classe ou un élève…"
        niveaux={niveaux}
        niveau={filtreNiveau}
        onNiveauChange={setFiltreNiveau}
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger le bilan.</p>
          <Button type="button" onClick={refresh}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={portalPanelClass}>
              <p className={portalKpiClass}>{moyenneCycle == null ? "—" : formatMoyenne(moyenneCycle)}</p>
              <h2 className={`${portalTitleClass} mt-1`}>Moyenne du cycle</h2>
              <p className={`${portalMutedClass} mt-1`}>{periode ?? "Période inactive"}</p>
            </div>
            <div className={portalPanelClass}>
              <p className={portalKpiClass}>{evalues}</p>
              <h2 className={`${portalTitleClass} mt-1`}>Élèves évalués</h2>
              <p className={`${portalMutedClass} mt-1`}>Sur l’effectif de votre cycle.</p>
            </div>
            <Link href="/prefet/bulletins" className={`${portalCardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}>
              <p className={portalKpiClass}>{sousDix}</p>
              <h2 className={`${portalTitleClass} mt-1`}>Sous 10</h2>
              <p className={`${portalMutedClass} mt-1`}>À suivre pour le bulletin de la période active.</p>
            </Link>
          </div>

          {chartData.length > 0 ? (
            <section className={portalPanelClass} aria-labelledby="chart-moyennes">
              <h2 id="chart-moyennes" className={portalTitleClass}>
                Moyennes par classe
              </h2>
              <p className={`${portalMutedClass} mt-1`}>Période active uniquement.</p>
              <div
                className="mt-4 h-64 w-full"
                role="img"
                aria-label={chartData.map((row) => `${row.nom} : ${formatMoyenne(row.moyenne)}`).join(". ")}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#D7E2F5" strokeDasharray="4 4" />
                    <XAxis dataKey="nom" tickLine={false} axisLine={false} tick={{ fill: "#5B6B86", fontSize: 12 }} />
                    <YAxis
                      domain={[0, 20]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#5B6B86", fontSize: 12 }}
                      width={32}
                    />
                    <Tooltip cursor={{ fill: "rgb(26 95 212 / 0.08)" }} content={<ChartTooltip />} />
                    <Bar
                      dataKey="moyenne"
                      fill="#1A5FD4"
                      radius={[12, 12, 8, 8]}
                      maxBarSize={48}
                      isAnimationActive={!reduceMotion}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : null}

          {classesFiltrees.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className={portalMutedClass}>
                {classes.length === 0
                  ? "Aucune classe dans votre cycle pour le moment."
                  : "Aucune classe ne correspond à la recherche."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {classesPage.map((classe) => (
                <article key={classe.id} className={portalPanelClass}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className={portalTitleClass}>
                        {classe.nom} · {classe.niveau}
                      </h2>
                      <p className={portalMutedClass}>
                        {classe.evalues} / {classe.effectif} élèves évalués
                        {classe.sousDix > 0 ? ` · ${classe.sousDix} sous 10` : ""}
                      </p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-primary">
                      {classe.moyenne == null ? "—" : `${formatMoyenne(classe.moyenne)} / 20`}
                    </p>
                  </div>

                  <ul className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(classe.mentions).map(([label, count]) => (
                      <li
                        key={label}
                        className="inline-flex min-h-9 items-center gap-2 rounded-full bg-secondary px-3 text-sm text-foreground"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: MENTION_COLORS[label] }}
                          aria-hidden
                        />
                        {label} · {count}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground">Meilleurs</p>
                      {classe.meilleurs.length === 0 ? (
                        <p className={portalMutedClass}>Aucune moyenne pour l’instant.</p>
                      ) : (
                        <ul className="space-y-1.5 text-sm">
                          {classe.meilleurs.map((eleve) => (
                            <li key={eleve.id} className="flex justify-between gap-3">
                              <Link
                                href={`/prefet/bulletins?eleveId=${eleve.id}`}
                                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {eleve.nom}
                              </Link>
                              <span className="tabular-nums text-muted-foreground">{formatMoyenne(eleve.moyenne)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground">En difficulté (&lt; 10)</p>
                      {classe.difficulte.length === 0 ? (
                        <p className={portalMutedClass}>Aucun élève sous 10.</p>
                      ) : (
                        <ul className="space-y-1.5 text-sm">
                          {classe.difficulte.map((eleve) => (
                            <li key={eleve.id} className="flex justify-between gap-3">
                              <Link
                                href={`/prefet/bulletins?eleveId=${eleve.id}`}
                                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {eleve.nom}
                              </Link>
                              <span className="tabular-nums text-destructive">{formatMoyenne(eleve.moyenne)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/prefet/eleves?classeId=${classe.id}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Voir les élèves
                    </Link>
                    <Link
                      href={`/prefet/bulletins`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Générer un bulletin
                    </Link>
                  </div>
                </article>
              ))}

              {classesFiltrees.length > 0 ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className={portalMutedClass}>
                    {from}–{to} sur {classesFiltrees.length} · {PAGE_SIZE} par page
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Page précédente"
                      disabled={pageSafe <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <ChevronLeft />
                      Précédent
                    </Button>
                    <p className="min-w-16 text-center text-sm tabular-nums text-foreground">
                      {pageSafe}/{pageCount}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Page suivante"
                      disabled={pageSafe >= pageCount}
                      onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    >
                      Suivant
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
