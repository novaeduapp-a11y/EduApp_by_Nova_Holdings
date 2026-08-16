import { z } from "zod";

// Schéma de base sans refinement
const baseEleveSchema = z.object({
  nom: z
    .string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z
    .string()
    .min(1, "Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  dateNaissance: z
    .string()
    .min(1, "La date de naissance est requise"),
  lieuNaissance: z.string().optional(),
  sexe: z.enum(["M", "F"], {
    message: "Le sexe est requis",
  }),
  classeId: z
    .string()
    .min(1, "La classe est requise"),
  nomPere: z.string().optional(),
  telephonePere: z.string().optional(),
  nomMere: z.string().optional(),
  telephoneMere: z.string().optional(),
  nomTuteur: z.string().optional(),
  telephoneTuteur: z.string().optional(),
  emailParent: z.string().min(1, "L'email du parent est requis").email("Email invalide"),
  adresse: z.string().optional(),
  photo: z.string().optional(),
});

// Schéma de création avec validation téléphone
export const createEleveSchema = baseEleveSchema.refine(
  (data) => data.telephonePere || data.telephoneMere || data.telephoneTuteur,
  {
    message: "Au moins un numéro de téléphone (père, mère ou tuteur) est requis",
    path: ["telephonePere"],
  }
);

export type CreateEleveInput = z.infer<typeof createEleveSchema>;

// Schéma de mise à jour (partial du schéma de base)
export const updateEleveSchema = baseEleveSchema.partial().extend({
  actif: z.boolean().optional(),
});

export type UpdateEleveInput = z.infer<typeof updateEleveSchema>;

export const importEleveSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  dateNaissance: z.string(),
  sexe: z.enum(["M", "F"]),
  classe: z.string().min(1),
  nomPere: z.string().optional(),
  telephonePere: z.string().optional(),
  nomMere: z.string().optional(),
  telephoneMere: z.string().optional(),
});

export type ImportEleveInput = z.infer<typeof importEleveSchema>;
