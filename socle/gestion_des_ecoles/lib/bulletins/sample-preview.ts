import type { BulletinData } from "@/lib/pdf/bulletin-template";
import {
  DEFAULT_BULLETIN_THEME,
  normalizeBulletinTheme,
  type BulletinThemeData,
} from "@/lib/bulletins/theme";

export type SampleEcoleInfo = {
  nom: string;
  nomOfficiel?: string | null;
  sigle?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  ville?: string | null;
};

export function buildSampleBulletinData(params: {
  ecole: SampleEcoleInfo;
  theme?: Partial<BulletinThemeData> | null;
}): BulletinData {
  const theme = normalizeBulletinTheme({
    ...DEFAULT_BULLETIN_THEME,
    ...params.theme,
    logoUrl: params.theme?.logoUrl ?? DEFAULT_BULLETIN_THEME.logoUrl,
  });

  return {
    ecole: {
      nom: params.ecole.nomOfficiel?.trim() || params.ecole.nom,
      adresse: params.ecole.adresse || `${params.ecole.ville || "Dakar"}, Sénégal`,
      telephone: params.ecole.telephone || "",
      email: params.ecole.email || "",
      sigle: params.ecole.sigle,
    },
    eleve: {
      nom: "DIOP",
      prenom: "Awa",
      matricule: "EX-2026-001",
      dateNaissance: "12/03/2014",
      classe: "6ème A",
      effectif: 32,
      photoUrl: theme.afficherPhoto ? null : null,
    },
    periode: {
      nom: "1er Trimestre",
      anneeScolaire: "2025-2026",
    },
    notes: [
      {
        matiere: "Mathématiques",
        note: 14.5,
        noteSur: 20,
        coefficient: 4,
        moyenne: 14.5,
        appreciation: "Très bien",
      },
      {
        matiere: "Français",
        note: 13,
        noteSur: 20,
        coefficient: 3,
        moyenne: 13,
        appreciation: "Bien",
      },
      {
        matiere: "Anglais",
        note: 15,
        noteSur: 20,
        coefficient: 2,
        moyenne: 15,
        appreciation: "Très bien",
      },
      {
        matiere: "Histoire-Géo",
        note: 12,
        noteSur: 20,
        coefficient: 2,
        moyenne: 12,
        appreciation: "Bien",
      },
      {
        matiere: "SVT",
        note: 11.5,
        noteSur: 20,
        coefficient: 2,
        moyenne: 11.5,
        appreciation: "Assez bien",
      },
    ],
    moyenneGenerale: 13.4,
    rang: 5,
    mention: "Bien",
    appreciationGenerale: "Bon travail. Des efforts réguliers à maintenir.",
    absences: {
      total: 2,
      justifiees: 1,
      nonJustifiees: 1,
    },
    theme,
    dateGeneration: new Date().toLocaleDateString("fr-FR"),
  };
}
