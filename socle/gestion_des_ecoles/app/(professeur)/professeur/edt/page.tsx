"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, ClipboardCheck, Users } from "lucide-react";
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
import { uniqueNiveaux } from "@/lib/eleve-filter";
import {
  portalMutedClass,
  portalPanelClass,
  portalTitleClass,
} from "@/components/eduadmins/portal-shell";

type Classe = { id: string; nom: string; niveau: string };
type Jour = { jour: string; label: string };
type Horaire = { heureDebut: string; heureFin: string };
type Creneau = {
  id: string;
  jour: string;
  horaire: string;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
  matiereId: string;
  matiere: string;
  classeId: string;
  classe: string;
  niveau: string;
};

export default function ProfEdtPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <ProfEdtForm />
    </Suspense>
  );
}

function ProfEdtForm() {
  const searchParams = useSearchParams();
  const classeFromUrl = searchParams.get("classeId") ?? "";

  const [jours, setJours] = useState<Jour[]>([]);
  const [horaires, setHoraires] = useState<Horaire[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [jourActif, setJourActif] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("");
  const [filtreClasse, setFiltreClasse] = useState(classeFromUrl);
  const [filtreMatiere, setFiltreMatiere] = useState("");
  const [filtreJour, setFiltreJour] = useState("");
  const [selected, setSelected] = useState<Creneau | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/staff/prof/edt");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setJours(body.data?.jours ?? []);
      setHoraires(body.data?.horaires ?? []);
      setClasses(body.data?.classes ?? []);
      setCreneaux(body.data?.creneaux ?? []);
      setJourActif(body.data?.jourActif ?? null);
      setStatus("ready");
    } catch {
      setCreneaux([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (classeFromUrl) setFiltreClasse(classeFromUrl);
  }, [classeFromUrl]);

  const niveaux = useMemo(() => uniqueNiveaux(classes), [classes]);
  const matieres = useMemo(() => {
    const map = new Map<string, string>();
    for (const creneau of creneaux) map.set(creneau.matiereId, creneau.matiere);
    return [...map.entries()]
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [creneaux]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return creneaux.filter((creneau) => {
      if (filtreNiveau && creneau.niveau !== filtreNiveau) return false;
      if (filtreClasse && creneau.classeId !== filtreClasse) return false;
      if (filtreMatiere && creneau.matiereId !== filtreMatiere) return false;
      if (filtreJour && creneau.jour !== filtreJour) return false;
      if (!q) return true;
      return `${creneau.matiere} ${creneau.classe} ${creneau.niveau} ${creneau.salle ?? ""} ${creneau.horaire}`
        .toLowerCase()
        .includes(q);
    });
  }, [creneaux, search, filtreNiveau, filtreClasse, filtreMatiere, filtreJour]);

  const joursVisibles = filtreJour ? jours.filter((jour) => jour.jour === filtreJour) : jours;
  const todaySlots = filtered
    .filter((creneau) => creneau.jour === (jourActif ?? ""))
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  const slotsAt = (jour: string, heureDebut: string, heureFin: string) =>
    filtered.filter(
      (creneau) =>
        creneau.jour === jour && creneau.heureDebut === heureDebut && creneau.heureFin === heureFin
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Planning</h1>
        <p className={`${portalMutedClass} mt-1`}>
          {status === "ready"
            ? `Grille lundi–vendredi · ${creneaux.length} cours · posée par le préfet.`
            : "Vos cours uniquement — lecture, saisie par le préfet."}
        </p>
      </div>

      <EleveToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher une matière, une classe ou une salle…"
        niveaux={niveaux}
        niveau={filtreNiveau}
        onNiveauChange={setFiltreNiveau}
        classes={classes}
        classeId={filtreClasse}
        onClasseChange={setFiltreClasse}
        extra={
          <>
            {matieres.length > 1 ? (
              <select
                className="edu-select"
                aria-label="Filtrer par matière"
                value={filtreMatiere}
                onChange={(e) => setFiltreMatiere(e.target.value)}
              >
                <option value="">Toutes les matières</option>
                {matieres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nom}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              className="edu-select"
              aria-label="Filtrer par jour"
              value={filtreJour}
              onChange={(e) => setFiltreJour(e.target.value)}
            >
              <option value="">Toute la semaine</option>
              {jours.map((jour) => (
                <option key={jour.jour} value={jour.jour}>
                  {jour.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      {status === "error" ? (
        <div className={`${portalPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm leading-6 text-foreground">Impossible de charger le planning.</p>
          <Button type="button" onClick={load}>
            Réessayer
          </Button>
        </div>
      ) : status === "loading" ? (
        <Skeleton className="h-96" />
      ) : creneaux.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className="font-medium text-foreground">Aucun cours dans votre grille</p>
          <p className={`${portalMutedClass} mt-1`}>
            Le préfet pose l’emploi du temps après vous avoir affecté une matière.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${portalPanelClass} py-10 text-center`}>
          <p className={portalMutedClass}>Aucun cours ne correspond à la recherche.</p>
        </div>
      ) : (
        <>
          {jourActif && !filtreJour ? (
            <section className={portalPanelClass}>
              <h2 className={portalTitleClass}>Aujourd’hui</h2>
              {todaySlots.length === 0 ? (
                <p className={`${portalMutedClass} mt-2`}>Pas de cours aujourd’hui dans ce filtre.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {todaySlots.map((slot) => (
                    <li key={slot.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-secondary/70 px-4 py-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setSelected(slot)}
                      >
                        <span>
                          <span className="block font-semibold text-foreground">{slot.matiere}</span>
                          <span className={portalMutedClass}>
                            {slot.classe}
                            {slot.salle ? ` · ${slot.salle}` : ""}
                          </span>
                        </span>
                        <span className="tabular-nums text-sm font-semibold text-primary">{slot.horaire}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <div className="overflow-x-auto rounded-3xl bg-card shadow-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="w-28 px-4 py-3 font-medium text-muted-foreground">Horaire</th>
                  {joursVisibles.map((jour) => (
                    <th
                      key={jour.jour}
                      className={`px-3 py-3 font-semibold ${
                        jour.jour === jourActif ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {jour.label}
                      {jour.jour === jourActif ? " · aujourd’hui" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horaires.map((horaire) => (
                  <tr key={`${horaire.heureDebut}-${horaire.heureFin}`} className="align-top">
                    <td className="px-4 py-2 font-semibold tabular-nums text-primary">
                      {horaire.heureDebut}–{horaire.heureFin}
                    </td>
                    {joursVisibles.map((jour) => {
                      const slots = slotsAt(jour.jour, horaire.heureDebut, horaire.heureFin);
                      return (
                        <td key={jour.jour} className="p-2">
                          {slots.length > 0 ? (
                            <div className="space-y-2">
                              {slots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  className="min-h-[88px] w-full rounded-2xl bg-secondary/80 p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  onClick={() => setSelected(slot)}
                                >
                                  <p className={portalTitleClass}>{slot.matiere}</p>
                                  <p className={`${portalMutedClass} mt-1 text-xs`}>
                                    {[slot.classe, slot.salle].filter(Boolean).join(" · ") || "—"}
                                  </p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex min-h-[88px] items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground">
                              <span className="sr-only">Aucun cours</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.matiere ?? "Cours"}</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.classe} · ${jours.find((jour) => jour.jour === selected.jour)?.label ?? selected.jour} ${selected.horaire}`
                : "Détail du créneau."}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-1 text-sm leading-6">
              <p>
                <span className="text-muted-foreground">Salle · </span>
                {selected.salle || "Non renseignée"}
              </p>
              <p>
                <span className="text-muted-foreground">Niveau · </span>
                {selected.niveau}
              </p>
              <p className={portalMutedClass}>La grille est posée par le préfet. Vous pouvez saisir l’appel et les notes.</p>
            </div>
          ) : null}
          <DialogFooter className="flex-wrap gap-2 sm:justify-start">
            {selected ? (
              <>
                <Button asChild>
                  <Link href={`/professeur/appel?classeId=${selected.classeId}`}>
                    <ClipboardCheck />
                    Faire l’appel
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/professeur/notes?classeId=${selected.classeId}`}>
                    <BookOpen />
                    Saisir les notes
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/professeur/classes/${selected.classeId}`}>
                    <Users />
                    Élèves
                  </Link>
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
