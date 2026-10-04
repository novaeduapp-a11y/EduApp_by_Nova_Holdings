"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EleveToolbar } from "@/components/shared/eleve-toolbar";
import {
  portalChipClass,
  portalKpiClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Statut = "PAYE" | "PARTIEL" | "NON_PAYE";

type Versement = {
  id: string;
  montant: number;
  date: string;
  mode: string;
  reference: string | null;
};

type Paiement = {
  id: string;
  typeFrais: string;
  typeLabel: string;
  montantTotal: number;
  montantPaye: number;
  reste: number;
  statut: Statut;
  anneeScolaire: string;
  echeance: string | null;
  description: string | null;
  eleve: { id: string; nom: string; classe: string };
  versements: Versement[];
};

const PAGE_SIZE = 30;

const STATUT_LABEL: Record<Statut, string> = {
  PAYE: "Payé",
  PARTIEL: "Partiel",
  NON_PAYE: "À régler",
};

function formatMontant(montant: number) {
  return `${new Intl.NumberFormat("fr-FR").format(montant)} FCFA`;
}

function formatJour(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaiementsParentPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [stats, setStats] = useState({ totalDu: 0, totalPaye: 0, reste: 0, count: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtreEnfant, setFiltreEnfant] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [page, setPage] = useState(1);
  const [reading, setReading] = useState<Paiement | null>(null);

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/parent/paiements");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setPaiements(body.data?.paiements ?? []);
      setStats(body.data?.stats ?? { totalDu: 0, totalPaye: 0, reste: 0, count: 0 });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const enfants = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of paiements) map.set(item.eleve.id, item.eleve.nom);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [paiements]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return paiements.filter((item) => {
      if (filtreEnfant && item.eleve.id !== filtreEnfant) return false;
      if (filtreStatut && item.statut !== filtreStatut) return false;
      if (!q) return true;
      return `${item.eleve.nom} ${item.typeLabel} ${item.anneeScolaire} ${item.description ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [paiements, search, filtreEnfant, filtreStatut]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreEnfant, filtreStatut]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Paiements</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Consultation uniquement. Les règlements se font à l’administration de l’école.
        </p>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les paiements.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Total dû</p>
              <p className={`${portalKpiClass} mt-1 text-2xl`}>{formatMontant(stats.totalDu)}</p>
            </div>
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Payé</p>
              <p className={`${portalKpiClass} mt-1 text-2xl`}>{formatMontant(stats.totalPaye)}</p>
            </div>
            <div className={portalPanelClass}>
              <p className={portalMutedClass}>Reste à payer</p>
              <p className={`${portalKpiClass} mt-1 text-2xl`}>{formatMontant(stats.reste)}</p>
            </div>
          </div>

          <EleveToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Rechercher un frais, un enfant…"
            extra={
              <>
                {enfants.length > 1 ? (
                  <select
                    className="edu-select"
                    aria-label="Filtrer par enfant"
                    value={filtreEnfant}
                    onChange={(e) => setFiltreEnfant(e.target.value)}
                  >
                    <option value="">Tous les enfants</option>
                    {enfants.map(([id, nom]) => (
                      <option key={id} value={id}>
                        {nom}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select
                  className="edu-select"
                  aria-label="Filtrer par statut"
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="NON_PAYE">À régler</option>
                  <option value="PARTIEL">Partiel</option>
                  <option value="PAYE">Payé</option>
                </select>
              </>
            }
          />

          {paiements.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className="font-medium text-foreground">Aucun frais enregistré</p>
              <p className={`${portalMutedClass} mt-1`}>
                Les frais de scolarité apparaîtront ici une fois saisis par l’administration.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`${portalPanelClass} py-10 text-center`}>
              <p className={portalMutedClass}>Aucun paiement ne correspond à la recherche.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enfant</TableHead>
                    <TableHead>Frais</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Échéance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setReading(item)}
                        >
                          <span className="font-medium text-foreground">{item.eleve.nom}</span>
                          <span className={`${portalMutedClass} mt-0.5 block`}>{item.eleve.classe}</span>
                        </button>
                      </TableCell>
                      <TableCell>{item.typeLabel}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMontant(item.montantTotal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMontant(item.montantPaye)}</TableCell>
                      <TableCell>
                        <span className={portalChipClass}>{STATUT_LABEL[item.statut]}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {item.echeance ? formatJour(item.echeance) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={portalMutedClass}>
                  {from}–{to} sur {filtered.length} · {PAGE_SIZE} par page
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
            </>
          )}
        </>
      )}

      <Dialog open={!!reading} onOpenChange={(open) => !open && setReading(null)}>
        <DialogContent className="sm:max-w-lg">
          {reading ? (
            <>
              <DialogHeader>
                <DialogTitle>{reading.typeLabel}</DialogTitle>
                <DialogDescription>
                  {reading.eleve.nom} · {reading.eleve.classe} · {reading.anneeScolaire}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Montant</dt>
                  <dd className="tabular-nums font-medium">{formatMontant(reading.montantTotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Payé</dt>
                  <dd className="tabular-nums font-medium">{formatMontant(reading.montantPaye)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reste</dt>
                  <dd className="tabular-nums font-medium">{formatMontant(reading.reste)}</dd>
                </div>
              </dl>
              {reading.versements.length > 0 ? (
                <ul className="space-y-2">
                  {reading.versements.map((versement) => (
                    <li key={versement.id} className="rounded-2xl bg-muted px-3 py-2 text-sm">
                      {formatJour(versement.date)} · {formatMontant(versement.montant)} · {versement.mode}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={portalMutedClass}>Aucun versement enregistré.</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReading(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
