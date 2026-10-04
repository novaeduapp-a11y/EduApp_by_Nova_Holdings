"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { EleveToolbar } from "@/components/shared/eleve-toolbar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  portalChipClass,
  portalMutedClass,
  portalPanelClass,
} from "@/components/eduadmins/portal-shell";

type AlerteData = {
  filId?: string;
  eleveId?: string;
  communiqueId?: string;
};

type Alerte = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  data: AlerteData | null;
};

const PAGE_SIZE = 30;

const TYPE_LABEL: Record<string, string> = {
  message: "Message",
  communique: "Communiqué",
  communique_urgent: "Urgent",
  note: "Note",
  absence: "Absence",
  bulletin: "Bulletin",
  convocation: "Convocation",
  alerte: "Alerte",
};

function typeLabel(type: string) {
  return TYPE_LABEL[type] ?? "Alerte";
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hrefFor(alerte: Alerte) {
  const eleveId = alerte.data?.eleveId;
  if (alerte.type === "message") {
    return eleveId ? `/parent/messages?eleveId=${eleveId}` : "/parent/messages";
  }
  if (alerte.type === "note" && eleveId) return `/parent/enfant/${eleveId}/notes`;
  if (alerte.type === "absence" && eleveId) return `/parent/enfant/${eleveId}/absences`;
  if (alerte.type === "bulletin" && eleveId) return `/parent/enfant/${eleveId}/bulletins`;
  return null;
}

function ctaFor(alerte: Alerte) {
  if (alerte.type === "message") return "Ouvrir la messagerie";
  if (alerte.type === "note") return "Voir les notes";
  if (alerte.type === "absence") return "Voir les absences";
  if (alerte.type === "bulletin") return "Voir les bulletins";
  return null;
}

export default function ParentAlertesPage() {
  const { toast } = useToast();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [filtreLu, setFiltreLu] = useState<"toutes" | "nonlues" | "lues">("toutes");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Alerte | null>(null);
  const [markAllOpen, setMarkAllOpen] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setStatus("loading");
    try {
      const res = await fetch("/api/parent/notifications");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setAlertes(body.data ?? []);
      setStatus("ready");
    } catch {
      if (!opts?.silent) {
        setAlertes([]);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, filtreType, filtreLu]);

  const types = useMemo(() => {
    const set = new Set(alertes.map((item) => item.type));
    return [...set].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b), "fr"));
  }, [alertes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alertes.filter((alerte) => {
      if (filtreType && alerte.type !== filtreType) return false;
      if (filtreLu === "nonlues" && alerte.readAt) return false;
      if (filtreLu === "lues" && !alerte.readAt) return false;
      if (!q) return true;
      return `${alerte.title} ${alerte.message} ${typeLabel(alerte.type)}`.toLowerCase().includes(q);
    });
  }, [alertes, search, filtreType, filtreLu]);

  const unread = alertes.filter((item) => !item.readAt).length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const unreadIds = ids.filter((id) => alertes.some((item) => item.id === id && !item.readAt));
    if (unreadIds.length === 0) return;
    setAlertes((current) =>
      current.map((item) => (unreadIds.includes(item.id) ? { ...item, readAt: new Date().toISOString() } : item))
    );
    const res = await fetch("/api/parent/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Lecture refusée" });
      await load({ silent: true });
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/parent/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Toutes les alertes sont lues." });
      setMarkAllOpen(false);
      await load({ silent: true });
    } catch {
      toast({ variant: "destructive", title: "Lecture refusée" });
    } finally {
      setBusy(false);
    }
  };

  const openAlerte = (alerte: Alerte) => {
    setSelected(alerte);
    void markRead([alerte.id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Alertes</h1>
          <p className={`${portalMutedClass} mt-1`}>
            {status === "ready"
              ? `${unread} non lue${unread > 1 ? "s" : ""} · communiqués, notes et messages des professeurs.`
              : "Communiqués, notes et messages des professeurs."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setMarkAllOpen(true)} disabled={unread === 0}>
          Tout marquer lu
        </Button>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un titre ou un message…"
        extra={
          <>
            {types.length > 1 ? (
              <select
                className="edu-select"
                aria-label="Filtrer par type"
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
              >
                <option value="">Tous les types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {typeLabel(type)}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              className="edu-select"
              aria-label="Filtrer par lecture"
              value={filtreLu}
              onChange={(e) => setFiltreLu(e.target.value as "toutes" | "nonlues" | "lues")}
            >
              <option value="toutes">Toutes</option>
              <option value="nonlues">Non lues</option>
              <option value="lues">Lues</option>
            </select>
          </>
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger les alertes.</p>
          <Button type="button" onClick={() => load()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">
            {alertes.length === 0 ? "Aucune alerte" : "Aucune alerte ne correspond à la recherche."}
          </p>
          {alertes.length === 0 ? (
            <p className={`${portalMutedClass} mt-1`}>Les communiqués et messages des professeurs apparaîtront ici.</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-2">
            {pageItems.map((alerte) => {
              const unreadItem = !alerte.readAt;
              return (
                <li key={alerte.id}>
                  <button
                    type="button"
                    onClick={() => openAlerte(alerte)}
                    className={`flex w-full items-start justify-between gap-3 rounded-3xl bg-card p-4 text-left shadow-card transition-[box-shadow,background-color] hover:shadow-[0_16px_40px_rgb(11_47_122_/_0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      unreadItem ? "ring-1 ring-primary/30" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        {unreadItem ? (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        ) : null}
                        <span className={`truncate ${unreadItem ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                          {alerte.title}
                        </span>
                        <span className={portalChipClass}>{typeLabel(alerte.type)}</span>
                      </span>
                      <span className={`${portalMutedClass} mt-1 line-clamp-2 block`}>{alerte.message}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {formatWhen(alerte.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={portalMutedClass}>
              {from}–{to} sur {filtered.length} · {PAGE_SIZE} par page
            </p>
            {filtered.length > PAGE_SIZE ? (
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
            ) : null}
          </div>
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title ?? "Alerte"}</DialogTitle>
            <DialogDescription>
              {selected ? `${typeLabel(selected.type)} · ${formatWhen(selected.createdAt)}` : "Détail de l’alerte."}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{selected?.message}</p>
          <DialogFooter>
            {selected && hrefFor(selected) && ctaFor(selected) ? (
              <Button asChild>
                <Link href={hrefFor(selected)!}>{ctaFor(selected)}</Link>
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setSelected(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={markAllOpen}
        onOpenChange={setMarkAllOpen}
        title="Tout marquer comme lu ?"
        description="Les points non lus disparaîtront. Vous pourrez toujours relire les alertes."
        confirmText="Tout marquer lu"
        isLoading={busy}
        onConfirm={markAll}
      />
    </div>
  );
}
