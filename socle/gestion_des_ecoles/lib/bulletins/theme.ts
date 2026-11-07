export const DEFAULT_COULEUR_PRIMAIRE = "#1e40af";
export const DEFAULT_COULEUR_SECONDAIRE = "#f0f9ff";

export const DEFAULT_LABELS_SIGNATURES = [
  "Le Directeur",
  "Le Maître/La Maîtresse",
  "Le Parent",
] as const;

export type BulletinThemeData = {
  logoUrl: string | null;
  couleurPrimaire: string;
  couleurSecondaire: string;
  lignesEntete: string[];
  lignesPied: string[];
  labelsSignatures: string[];
  afficherPhoto: boolean;
  afficherAbsences: boolean;
  afficherObservationConseil: boolean;
  layout: "CLASSIQUE";
};

export const DEFAULT_BULLETIN_THEME: BulletinThemeData = {
  logoUrl: null,
  couleurPrimaire: DEFAULT_COULEUR_PRIMAIRE,
  couleurSecondaire: DEFAULT_COULEUR_SECONDAIRE,
  lignesEntete: [],
  lignesPied: [],
  labelsSignatures: [...DEFAULT_LABELS_SIGNATURES],
  afficherPhoto: false,
  afficherAbsences: true,
  afficherObservationConseil: true,
  layout: "CLASSIQUE",
};

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function normalizeBulletinTheme(row: {
  logoUrl?: string | null;
  couleurPrimaire?: string | null;
  couleurSecondaire?: string | null;
  lignesEntete?: unknown;
  lignesPied?: unknown;
  labelsSignatures?: unknown;
  afficherPhoto?: boolean | null;
  afficherAbsences?: boolean | null;
  afficherObservationConseil?: boolean | null;
  layout?: string | null;
} | null | undefined): BulletinThemeData {
  if (!row) return { ...DEFAULT_BULLETIN_THEME };

  const couleurPrimaire =
    typeof row.couleurPrimaire === "string" && /^#[0-9A-Fa-f]{6}$/.test(row.couleurPrimaire)
      ? row.couleurPrimaire
      : DEFAULT_COULEUR_PRIMAIRE;
  const couleurSecondaire =
    typeof row.couleurSecondaire === "string" && /^#[0-9A-Fa-f]{6}$/.test(row.couleurSecondaire)
      ? row.couleurSecondaire
      : DEFAULT_COULEUR_SECONDAIRE;

  const labels = asStringArray(row.labelsSignatures, [...DEFAULT_LABELS_SIGNATURES]);
  while (labels.length < 3) {
    labels.push(DEFAULT_LABELS_SIGNATURES[labels.length] ?? "Signature");
  }

  return {
    logoUrl: row.logoUrl?.trim() || null,
    couleurPrimaire,
    couleurSecondaire,
    lignesEntete: asStringArray(row.lignesEntete, []).slice(0, 4),
    lignesPied: asStringArray(row.lignesPied, []).slice(0, 3),
    labelsSignatures: labels.slice(0, 3),
    afficherPhoto: Boolean(row.afficherPhoto),
    afficherAbsences: row.afficherAbsences !== false,
    afficherObservationConseil: row.afficherObservationConseil !== false,
    layout: "CLASSIQUE",
  };
}
