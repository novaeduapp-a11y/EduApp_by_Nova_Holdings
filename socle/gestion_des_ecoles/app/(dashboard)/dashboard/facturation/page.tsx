"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type Ecole = {
  id: string;
  nom: string;
  ville: string;
  actif: boolean;
  paiementAJour: boolean;
  montantMensuel: number | null;
  montantAnnuel: number | null;
};

function cfa(value: number | null) {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function AdminFacturationPage() {
  const { toast } = useToast();
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState<"tous" | "retard" | "ajour">("tous");

  const load = async () => {
    const res = await fetch("/api/admin/ecoles");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setEcoles(body.data ?? []);
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      await load();
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ecoles.filter((ecole) => {
      if (filtre === "retard" && ecole.paiementAJour) return false;
      if (filtre === "ajour" && !ecole.paiementAJour) return false;
      if (!q) return true;
      return `${ecole.nom} ${ecole.ville}`.toLowerCase().includes(q);
    });
  }, [ecoles, search, filtre]);

  const enRetard = ecoles.filter((ecole) => !ecole.paiementAJour).length;

  const patch = async (id: string, payload: Record<string, unknown>, title: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ecoles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast({ title });
      await load();
      setStatus("ready");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action refusée",
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
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">
            Facturation &amp; Abonnement
          </h1>
          <p className={`${portalMutedClass} mt-1`}>
            Suivi des licences NOVA, retards et blocage d’accès
            {status === "ready" ? ` · ${enRetard} en retard` : ""}.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setFiltre("retard")}>
          Toutes les écoles en retard
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
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
        <select
          className="edu-select"
          aria-label="Filtrer par paiement"
          value={filtre}
          onChange={(e) => setFiltre(e.target.value as typeof filtre)}
        >
          <option value="tous">Tous</option>
          <option value="retard">En retard</option>
          <option value="ajour">À jour</option>
        </select>
      </div>

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger la facturation.</p>
          <Button type="button" onClick={() => void refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>Aucun établissement pour ce filtre.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Établissement</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead className="text-right">Mensuel</TableHead>
              <TableHead className="text-right">Annuel</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Accès</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ecole) => (
              <TableRow key={ecole.id}>
                <TableCell className="font-medium uppercase">
                  <Link href={`/dashboard/ecoles/${ecole.id}`} className="hover:text-primary">
                    {ecole.nom}
                  </Link>
                </TableCell>
                <TableCell>{ecole.ville}</TableCell>
                <TableCell className="text-right tabular-nums">{cfa(ecole.montantMensuel)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {cfa(ecole.montantAnnuel ?? (ecole.montantMensuel != null ? ecole.montantMensuel * 10 : null))}
                </TableCell>
                <TableCell>
                  <span
                    className={`${portalChipClass} ${
                      ecole.paiementAJour ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ecole.paiementAJour ? "À jour" : "Impayé"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={portalChipClass}>{ecole.actif ? "Ouvert" : "Bloqué"}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className={
                        ecole.paiementAJour
                          ? "border-red-200 text-red-700 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }
                      onClick={() =>
                        void patch(
                          ecole.id,
                          { paiementAJour: !ecole.paiementAJour },
                          ecole.paiementAJour ? "Marqué impayé" : "Marqué à jour"
                        )
                      }
                    >
                      {ecole.paiementAJour ? "Marquer impayé" : "Marquer payé"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void patch(
                          ecole.id,
                          { actif: !ecole.actif },
                          ecole.actif ? "Accès bloqué" : "Accès rétabli"
                        )
                      }
                    >
                      {ecole.actif ? "Bloquer l’accès" : "Débloquer"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
