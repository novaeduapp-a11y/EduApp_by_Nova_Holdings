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

type Role = "ADMIN" | "DIRECTEUR" | "PREFET" | "PROFESSEUR" | "PARENT" | "ELEVE";

type LogRow = {
  id: string;
  action: string;
  table: string | null;
  details: Record<string, unknown>;
  voie: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; nom: string; email: string; role: Role; ecole: string | null } | null;
};

type SuiviRow = {
  id: string;
  nom: string;
  email: string;
  role: Role;
  actif: boolean;
  ecole: string | null;
  creeLe: string;
  derniereAction: string | null;
  derniereDate: string | null;
  derniereVoie: string | null;
};

const PAGE_SIZE = 30;

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin NOVA",
  DIRECTEUR: "Directeur",
  PREFET: "Préfet",
  PROFESSEUR: "Professeur",
  PARENT: "Parent",
  ELEVE: "Élève",
};

const ACTION_LABEL: Record<string, string> = {
  connexion: "Connexion",
  connexion_refusee: "Connexion refusée",
  ecole_creee: "Établissement créé",
  ecole_modifiee: "Établissement modifié",
  ecole_desactivee: "Établissement désactivé",
  ecole_reactivee: "Établissement réactivé",
  compte_cree: "Compte créé",
  compte_modifie: "Compte modifié",
  compte_desactive: "Compte désactivé",
  compte_reactive: "Compte réactivé",
  mot_de_passe_reinitialise: "Mot de passe réinitialisé",
  parametres_enregistres: "Paramètres enregistrés",
  periode_activee: "Période activée",
  periode_desactivee: "Période désactivée",
};

const VOIE_LABEL: Record<string, string> = {
  web: "Web",
  eduadmins: "EduAdmins",
  eduparent: "EduParent",
};

function actionLabel(action: string) {
  return ACTION_LABEL[action] ?? action.split("_").join(" ");
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminLogsPage() {
  const [onglet, setOnglet] = useState<"journal" | "suivi">("journal");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [suivi, setSuivi] = useState<SuiviRow[]>([]);
  const [totaux, setTotaux] = useState({ comptes: 0, actifs: 0, jamaisConnectes: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtreAction, setFiltreAction] = useState("");
  const [filtreRole, setFiltreRole] = useState("");
  const [filtreVoie, setFiltreVoie] = useState("");
  const [filtreActif, setFiltreActif] = useState("");
  const [page, setPage] = useState(1);
  const [reading, setReading] = useState<LogRow | null>(null);

  const loadJournal = async () => {
    const query = new URLSearchParams();
    if (search.trim()) query.set("q", search.trim());
    if (filtreAction) query.set("action", filtreAction);
    if (filtreRole) query.set("role", filtreRole);
    if (filtreVoie) query.set("voie", filtreVoie);
    const res = await fetch(`/api/admin/logs?${query.toString()}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setLogs(body.data?.logs ?? []);
    setActions(body.data?.actions ?? []);
  };

  const loadSuivi = async () => {
    const query = new URLSearchParams();
    if (search.trim()) query.set("q", search.trim());
    if (filtreRole) query.set("role", filtreRole);
    if (filtreActif) query.set("actif", filtreActif);
    const res = await fetch(`/api/admin/suivi?${query.toString()}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setSuivi(body.data?.utilisateurs ?? []);
    setTotaux(body.data?.totaux ?? { comptes: 0, actifs: 0, jamaisConnectes: 0 });
  };

  const refresh = async () => {
    setStatus("loading");
    try {
      if (onglet === "journal") await loadJournal();
      else await loadSuivi();
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void refresh();
  }, [onglet, filtreAction, filtreRole, filtreVoie, filtreActif]);

  useEffect(() => {
    setPage(1);
  }, [onglet, search, filtreAction, filtreRole, filtreVoie, filtreActif]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const list = onglet === "journal" ? logs : suivi;
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageItems = list.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const from = list.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, list.length);

  const connexions = useMemo(
    () => logs.filter((row) => row.action === "connexion").length,
    [logs]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Logs et suivi</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Connexions et actions d’administration, pour tous les rôles (parents, profs, préfets, direction, admin).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={onglet === "journal" ? "default" : "outline"} onClick={() => setOnglet("journal")}>
          Journal
        </Button>
        <Button type="button" variant={onglet === "suivi" ? "default" : "outline"} onClick={() => setOnglet("suivi")}>
          Utilisateurs
        </Button>
      </div>

      {onglet === "suivi" && status === "ready" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={portalPanelClass}>
            <p className={portalMutedClass}>Comptes</p>
            <p className={`${portalKpiClass} mt-1`}>{totaux.comptes}</p>
          </div>
          <div className={portalPanelClass}>
            <p className={portalMutedClass}>Actifs</p>
            <p className={`${portalKpiClass} mt-1`}>{totaux.actifs}</p>
          </div>
          <div className={portalPanelClass}>
            <p className={portalMutedClass}>Jamais vus dans le journal</p>
            <p className={`${portalKpiClass} mt-1`}>{totaux.jamaisConnectes}</p>
          </div>
        </div>
      ) : null}

      {onglet === "journal" && status === "ready" ? (
        <p className={portalMutedClass}>
          {logs.length} événement{logs.length > 1 ? "s" : ""} récents · {connexions} connexion{connexions > 1 ? "s" : ""}
        </p>
      ) : null}

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder={onglet === "journal" ? "Rechercher une action, un nom, un e-mail…" : "Rechercher un utilisateur…"}
        extra={
          <>
            {onglet === "journal" && actions.length > 0 ? (
              <select className="edu-select" aria-label="Filtrer par action" value={filtreAction} onChange={(e) => setFiltreAction(e.target.value)}>
                <option value="">Toutes les actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {actionLabel(action)}
                  </option>
                ))}
              </select>
            ) : null}
            <select className="edu-select" aria-label="Filtrer par rôle" value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)}>
              <option value="">Tous les rôles</option>
              {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
            {onglet === "journal" ? (
              <select className="edu-select" aria-label="Filtrer par voie" value={filtreVoie} onChange={(e) => setFiltreVoie(e.target.value)}>
                <option value="">Toutes les voies</option>
                <option value="web">Web</option>
                <option value="eduadmins">EduAdmins</option>
                <option value="eduparent">EduParent</option>
              </select>
            ) : (
              <select className="edu-select" aria-label="Filtrer par statut" value={filtreActif} onChange={(e) => setFiltreActif(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
              </select>
            )}
          </>
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger le journal.</p>
          <Button type="button" onClick={() => refresh()}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-72" />
      ) : list.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">
            {onglet === "journal" ? "Aucun événement" : "Aucun utilisateur"}
          </p>
          <p className={`${portalMutedClass} mt-1`}>
            {onglet === "journal"
              ? "Les connexions et les actions d’administration apparaîtront ici."
              : "Aucun compte ne correspond aux filtres."}
          </p>
        </div>
      ) : onglet === "journal" ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quand</TableHead>
                <TableHead>Qui</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Voie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pageItems as LogRow[]).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatWhen(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setReading(row)}
                    >
                      <span className="font-medium text-foreground">{row.user?.nom ?? "Système"}</span>
                      <span className={`${portalMutedClass} mt-0.5 block`}>
                        {row.user ? `${ROLE_LABEL[row.user.role]}${row.user.ecole ? ` · ${row.user.ecole}` : ""}` : row.ipAddress ?? "—"}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className={portalChipClass}>{actionLabel(row.action)}</span>
                  </TableCell>
                  <TableCell>{row.voie ? VOIE_LABEL[row.voie] ?? row.voie : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Établissement</TableHead>
              <TableHead>Dernière activité</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(pageItems as SuiviRow[]).map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium text-foreground">{row.nom}</span>
                  <span className={`${portalMutedClass} mt-0.5 block`}>{row.email}</span>
                </TableCell>
                <TableCell>{ROLE_LABEL[row.role]}</TableCell>
                <TableCell>{row.ecole ?? "—"}</TableCell>
                <TableCell>
                  {row.derniereDate ? (
                    <>
                      <span className="text-sm text-foreground">{actionLabel(row.derniereAction ?? "")}</span>
                      <span className={`${portalMutedClass} mt-0.5 block`}>
                        {formatWhen(row.derniereDate)}
                        {row.derniereVoie ? ` · ${VOIE_LABEL[row.derniereVoie] ?? row.derniereVoie}` : ""}
                      </span>
                    </>
                  ) : (
                    <span className={portalMutedClass}>Jamais vu dans le journal</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={portalChipClass}>{row.actif ? "Actif" : "Inactif"}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {status === "ready" && list.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={portalMutedClass}>
            {from}–{to} sur {list.length} · {PAGE_SIZE} par page
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={pageSafe <= 1} onClick={() => setPage((c) => Math.max(1, c - 1))}>
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
              onClick={() => setPage((c) => Math.min(pageCount, c + 1))}
            >
              Suivant
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={!!reading} onOpenChange={(open) => !open && setReading(null)}>
        <DialogContent className="sm:max-w-lg">
          {reading ? (
            <>
              <DialogHeader>
                <DialogTitle>{actionLabel(reading.action)}</DialogTitle>
                <DialogDescription>
                  {formatWhen(reading.createdAt)}
                  {reading.user ? ` · ${reading.user.nom}` : ""}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd>{reading.user?.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Rôle</dt>
                  <dd>{reading.user ? ROLE_LABEL[reading.user.role] : "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Voie</dt>
                  <dd>{reading.voie ? VOIE_LABEL[reading.voie] ?? reading.voie : "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">IP</dt>
                  <dd className="font-mono text-xs">{reading.ipAddress ?? "—"}</dd>
                </div>
              </dl>
              {Object.keys(reading.details).length > 0 ? (
                <pre className="max-h-40 overflow-auto rounded-2xl bg-muted p-3 text-xs">
                  {JSON.stringify(reading.details, null, 2)}
                </pre>
              ) : null}
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
