export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "EduApps";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const NIVEAUX_PRIMAIRE = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"] as const;
export const NIVEAUX_COLLEGE = ["6ème", "5ème", "4ème", "3ème"] as const;
export const NIVEAUX_SECONDAIRE = ["Seconde", "Première", "Terminale"] as const;
export const NIVEAUX = [...NIVEAUX_PRIMAIRE, ...NIVEAUX_COLLEGE, ...NIVEAUX_SECONDAIRE] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const FAMILLES_CYCLE = {
  PRIMAIRE: { label: "Primaire", niveaux: NIVEAUX_PRIMAIRE },
  COLLEGE: { label: "Collège", niveaux: NIVEAUX_COLLEGE },
  SECONDAIRE: { label: "Secondaire", niveaux: NIVEAUX_SECONDAIRE },
} as const;

export const ANNEE_SCOLAIRE_COURANTE = "2025-2026";

export const MENTIONS = {
  TRES_BIEN: { min: 16, label: "Très Bien", color: "text-green-600" },
  BIEN: { min: 14, label: "Bien", color: "text-blue-600" },
  ASSEZ_BIEN: { min: 12, label: "Assez Bien", color: "text-cyan-600" },
  PASSABLE: { min: 10, label: "Passable", color: "text-yellow-600" },
  INSUFFISANT: { min: 0, label: "Insuffisant", color: "text-red-600" },
} as const;

export function getMention(moyenne: number): string {
  if (moyenne >= MENTIONS.TRES_BIEN.min) return MENTIONS.TRES_BIEN.label;
  if (moyenne >= MENTIONS.BIEN.min) return MENTIONS.BIEN.label;
  if (moyenne >= MENTIONS.ASSEZ_BIEN.min) return MENTIONS.ASSEZ_BIEN.label;
  if (moyenne >= MENTIONS.PASSABLE.min) return MENTIONS.PASSABLE.label;
  return MENTIONS.INSUFFISANT.label;
}

export function generateMatricule(niveau: string, sequence: number): string {
  const year = new Date().getFullYear();
  const seq = sequence.toString().padStart(3, "0");
  return `${year}${niveau}${seq}`;
}

export const ROLES = {
  ADMIN: "ADMIN",
  DIRECTEUR: "DIRECTEUR",
  PROFESSEUR: "PROFESSEUR",
  PREFET: "PREFET",
  PARENT: "PARENT",
  ELEVE: "ELEVE",
} as const;

export const TYPES_EVALUATION = {
  DEVOIR: "DEVOIR",
  COMPOSITION: "COMPOSITION",
  INTERROGATION: "INTERROGATION",
  TP: "TP",
} as const;

export const PERIODES_JOURNEE = {
  MATIN: "MATIN",
  APRES_MIDI: "APRES_MIDI",
  JOURNEE: "JOURNEE",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
