"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  portalChipClass,
  portalHeroClass,
  portalKpiClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Ecole = {
  id: string;
  nom: string;
  ville: string;
  actif: boolean;
  eleves: number;
  classes: number;
  directeurs: number;
  prefets: number;
  professeurs: number;
};

const PAGE_SIZE = 30;

export default function AdminHomePage() {
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/ecoles");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setEcoles(body.data ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = ecoles.reduce(
    (acc, ecole) => ({
      ecoles: acc.ecoles + 1,
      actives: acc.actives + (ecole.actif ? 1 : 0),
      eleves: acc.eleves + ecole.eleves,
      professeurs: acc.professeurs + ecole.professeurs,
      prefets: acc.prefets + ecole.prefets,
      directeurs: acc.directeurs + ecole.directeurs,
    }),
    { ecoles: 0, actives: 0, eleves: 0, professeurs: 0, prefets: 0, directeurs: 0 }
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ecoles;
    return ecoles.filter((ecole) => `${ecole.nom} ${ecole.ville}`.toLowerCase().includes(q));
  }, [ecoles, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      <section className={portalHeroClass}>
        <p className="text-sm font-medium text-white/80">NOVA HOLDINGS</p>
        <h1 className="mt-1 text-balance text-[30px] font-bold leading-9 tracking-tight">Administration</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
          Établissements et comptes Direction, Préfet, Professeur. Le quotidien pédagogique reste dans EduAdmins.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/dashboard/ecoles?creer=1">Nouvel établissement</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <Link href="/dashboard/comptes?creer=1">Nouveau compte</Link>
          </Button>
        </div>
      </section>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les établissements.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/ecoles" className={portalPanelClass}>
              <p className={portalMutedClass}>Établissements</p>
              <p className={`${portalKpiClass} mt-1`}>{totals.ecoles}</p>
              <p className={`${portalMutedClass} mt-1`}>{totals.actives} actif{totals.actives > 1 ? "s" : ""}</p>
            </Link>
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Élèves</p>
              <p className={`${portalKpiClass} mt-1`}>{totals.eleves}</p>
            </div>
            <Link href="/dashboard/comptes?role=PROFESSEUR" className={portalPanelClass}>
              <p className={portalMutedClass}>Professeurs</p>
              <p className={`${portalKpiClass} mt-1`}>{totals.professeurs}</p>
            </Link>
            <Link href="/dashboard/comptes?role=PREFET" className={portalPanelClass}>
              <p className={portalMutedClass}>Préfets</p>
              <p className={`${portalKpiClass} mt-1`}>{totals.prefets}</p>
              <p className={`${portalMutedClass} mt-1`}>{totals.directeurs} directeur{totals.directeurs > 1 ? "s" : ""}</p>
            </Link>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un établissement…"
              className="pl-9"
              aria-label="Rechercher un établissement"
            />
          </div>

          {ecoles.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className="font-medium text-foreground">Aucun établissement</p>
              <p className={`${portalMutedClass} mt-1`}>Créez-en un, puis le directeur et les préfets.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/ecoles?creer=1">Nouvel établissement</Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className={portalMutedClass}>Aucun établissement ne correspond à la recherche.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead className="text-right">Direction</TableHead>
                    <TableHead className="text-right">Préfets</TableHead>
                    <TableHead className="text-right">Profs</TableHead>
                    <TableHead className="text-right">Élèves</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((ecole) => (
                    <TableRow key={ecole.id}>
                      <TableCell className="font-medium">
                        <Link href="/dashboard/ecoles" className="hover:underline">
                          {ecole.nom}
                        </Link>
                      </TableCell>
                      <TableCell>{ecole.ville}</TableCell>
                      <TableCell className="text-right tabular-nums">{ecole.directeurs}</TableCell>
                      <TableCell className="text-right tabular-nums">{ecole.prefets}</TableCell>
                      <TableCell className="text-right tabular-nums">{ecole.professeurs}</TableCell>
                      <TableCell className="text-right tabular-nums">{ecole.eleves}</TableCell>
                      <TableCell>
                        <span className={portalChipClass}>{ecole.actif ? "Actif" : "Inactif"}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={portalMutedClass}>
                  {from}–{to} sur {filtered.length} · {PAGE_SIZE} par page
                </p>
                {filtered.length > PAGE_SIZE ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pageSafe <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <ChevronLeft />
                      Précédent
                    </Button>
                    <p className="min-w-16 text-center text-sm tabular-nums">
                      {pageSafe}/{pageCount}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pageSafe >= pageCount}
                      onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    >
                      Suivant
                      <ChevronRight />
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
