export const colors = {
  primary: "#1A5FD4",
  background: "#F4F7FF",
  white: "#FFFFFF",
  text: "#12203A",
  muted: "#5B6B86",
  border: "#D7E2F5",
  tint: "#E8F0FE",
  good: "#1A5FD4",
  passable: "#3D6FBF",
  fail: "#C62828",
  warn: "#C47B17",
} as const;

export function greeting(hour = new Date().getHours()): string {
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export const portails = [
  {
    id: "PROFESSEUR" as const,
    title: "Professeurs",
    text: "Notes, présences et classes — votre matière ou votre classe uniquement.",
  },
  {
    id: "PREFET" as const,
    title: "Préfets",
    text: "Inscriptions, bulletins et EDT, isolés par cycle.",
  },
  {
    id: "DIRECTION" as const,
    title: "Direction",
    text: "Bilan du jour et pilotage. Code à 6 chiffres obligatoire.",
  },
];
