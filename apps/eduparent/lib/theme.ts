export const colors = {
  primary: "#1A5FD4",
  background: "#F4F7FF",
  white: "#FFFFFF",
  text: "#12203A",
  muted: "#5B6B86",
  border: "#D7E2F5",
  good: "#1A5FD4",
  passable: "#6B9AE8",
  fail: "#C62828",
} as const;

export function greeting(hour = new Date().getHours()): string {
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function noteColor(value: number | null): string {
  if (value == null) return colors.muted;
  if (value >= 14) return colors.good;
  if (value >= 10) return colors.passable;
  return colors.fail;
}
