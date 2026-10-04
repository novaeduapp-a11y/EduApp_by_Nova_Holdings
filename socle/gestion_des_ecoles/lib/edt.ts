import type { JourSemaine } from "@prisma/client";

export const JOURS_SEMAINE: { jour: JourSemaine; label: string }[] = [
  { jour: "LUNDI", label: "Lundi" },
  { jour: "MARDI", label: "Mardi" },
  { jour: "MERCREDI", label: "Mercredi" },
  { jour: "JEUDI", label: "Jeudi" },
  { jour: "VENDREDI", label: "Vendredi" },
];

export const CRENEAUX_DEFAUT = [
  { heureDebut: "08:00", heureFin: "09:00" },
  { heureDebut: "09:00", heureFin: "10:00" },
  { heureDebut: "10:15", heureFin: "11:15" },
  { heureDebut: "11:15", heureFin: "12:15" },
  { heureDebut: "15:00", heureFin: "16:00" },
  { heureDebut: "16:00", heureFin: "17:00" },
] as const;

const HEURE_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isHeureValide(value: string) {
  return HEURE_RE.test(value);
}

export function minutesDepuisMinuit(heure: string) {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

export function creneauxSeChevauchent(
  a: { heureDebut: string; heureFin: string },
  b: { heureDebut: string; heureFin: string }
) {
  return (
    minutesDepuisMinuit(a.heureDebut) < minutesDepuisMinuit(b.heureFin) &&
    minutesDepuisMinuit(a.heureFin) > minutesDepuisMinuit(b.heureDebut)
  );
}

export function jourSemaineAujourdhui(): JourSemaine | null {
  const keys = [null, "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", null] as const;
  return keys[new Date().getDay()] ?? null;
}

export function formatHoraire(heureDebut: string, heureFin: string) {
  return `${heureDebut}–${heureFin}`;
}

export function serializeCreneau(creneau: {
  id: string;
  jour: JourSemaine;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
  matiere: { nom: string };
  professeur: { prenom: string; nom: string } | null;
}) {
  return {
    id: creneau.id,
    jour: creneau.jour,
    matiere: creneau.matiere.nom,
    horaire: formatHoraire(creneau.heureDebut, creneau.heureFin),
    salle: creneau.salle,
    professeur: creneau.professeur
      ? `${creneau.professeur.prenom} ${creneau.professeur.nom}`
      : null,
  };
}
