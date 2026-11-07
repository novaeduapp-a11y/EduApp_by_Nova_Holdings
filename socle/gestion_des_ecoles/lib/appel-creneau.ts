import type { JourSemaine } from "@prisma/client";

export type AppelStatut = "PRESENT" | "ABSENT" | "RETARD" | "ABSENT_RETARD";

const JOURS: JourSemaine[] = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

/** Date ISO YYYY-MM-DD → jour EDT (lun–sam). Dimanche → null. */
export function jourSemaineFromDate(dateIso: string): JourSemaine | null {
  const date = new Date(`${dateIso}T12:00:00`);
  const day = date.getDay(); // 0 dim … 6 sam
  if (day === 0) return null;
  return JOURS[day - 1] ?? null;
}

export function statutFromMotif(motif: string | null | undefined): AppelStatut {
  const value = motif ?? "";
  // Ancien « Absence et retard » → traité comme absence (plus de statut combiné).
  if (/absence\s*et\s*retard|abs\.\s*\+\s*retard/i.test(value)) return "ABSENT";
  if (/^retard\b/i.test(value.trim()) || /^retard$/i.test(value.trim())) return "RETARD";
  if (value.trim()) return "ABSENT";
  return "PRESENT";
}

export function motifFromStatut(statut: Exclude<AppelStatut, "PRESENT">): string {
  if (statut === "RETARD") return "Retard";
  return "Absence";
}

export function dureeHeuresFromCreneau(heureDebut: string, heureFin: string): number {
  const [h1, m1] = heureDebut.split(":").map(Number);
  const [h2, m2] = heureFin.split(":").map(Number);
  const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  if (!Number.isFinite(minutes) || minutes <= 0) return 1;
  return Math.round((minutes / 60) * 100) / 100;
}

export function pickDefaultCreneau<T extends { heureDebut: string; heureFin: string }>(
  creneaux: T[],
  now = new Date()
): T | null {
  if (creneaux.length === 0) return null;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const courant = creneaux.find((c) => c.heureDebut <= hhmm && hhmm < c.heureFin);
  if (courant) return courant;
  const aVenir = creneaux.find((c) => c.heureDebut > hhmm);
  return aVenir ?? creneaux[creneaux.length - 1] ?? null;
}
