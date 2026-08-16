export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR");
}

export function weekdayKey(
  date = new Date()
): "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | null {
  const keys = [null, "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", null] as const;
  return keys[date.getDay()] ?? null;
}

export function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 60);
}
