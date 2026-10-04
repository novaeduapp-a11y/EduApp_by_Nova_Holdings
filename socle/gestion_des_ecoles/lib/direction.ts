import { dayBounds } from "@/lib/prof-scope";

export function parseDateIso(value: string | null) {
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : new Date().toISOString().slice(0, 10);
  return { date, ...dayBounds(date) };
}

export function nomComplet(user: { prenom: string; nom: string }) {
  return `${user.prenom} ${user.nom}`;
}
