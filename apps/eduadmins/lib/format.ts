export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR");
}

export function todayIso(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
