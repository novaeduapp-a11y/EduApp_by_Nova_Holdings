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
    demo: "professeur@ecole.sn",
  },
  {
    id: "PREFET" as const,
    title: "Préfets",
    text: "Inscriptions, bulletins et EDT, isolés par cycle.",
    demo: "prefet.primaire@ecole.sn",
  },
  {
    id: "DIRECTION" as const,
    title: "Direction",
    text: "Bilan du jour et pilotage. Code à 6 chiffres obligatoire.",
    demo: "directeur@ecole.sn",
  },
];
