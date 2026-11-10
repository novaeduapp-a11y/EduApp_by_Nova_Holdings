export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR");
}

/** Note scolaire en français : 15,5 au lieu de 15.5 */
export function formatNoteFr(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace(".", ",");
}

export function rangLabel(rang: number, withClasse = true): string {
  if (rang === 1) return withClasse ? "1er de la classe" : "1er";
  return withClasse ? `${rang}e de la classe` : `${rang}e`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(date: Date, now = new Date()) {
  return Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
}

export function formatTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(value: string | Date, now = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const days = daysAgo(date, now);
  if (days === 0) return formatTime(date);
  if (days === 1) return "Hier";
  if (days < 7) {
    const label = date.toLocaleDateString("fr-FR", { weekday: "short" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function dayLabel(value: string | Date, now = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const days = daysAgo(date, now);
  if (days === 0) return "Aujourd’hui";
  if (days === 1) return "Hier";
  const label = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function periodBucket(value: string | Date, now = new Date()): "Aujourd’hui" | "Hier" | "Cette semaine" | "Plus ancien" {
  const date = value instanceof Date ? value : new Date(value);
  const days = Number.isNaN(date.getTime()) ? 99 : daysAgo(date, now);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Hier";
  if (days < 7) return "Cette semaine";
  return "Plus ancien";
}

export function initials(name: string): string {
  const parts = name.replace(/^(M\.|Mme|Mlle|Mr)\s+/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function weekdayKey(
  date = new Date()
): "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | "SAMEDI" | null {
  const keys = [null, "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"] as const;
  return keys[date.getDay()] ?? null;
}

export function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 60);
}
