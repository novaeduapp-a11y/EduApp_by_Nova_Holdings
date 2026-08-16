import { z } from "zod";

export const createAbsenceSchema = z.object({
  eleveId: z
    .string()
    .min(1, "L'élève est requis"),
  dateAbsence: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  periode: z
    .enum(["MATIN", "APRES_MIDI", "JOURNEE"])
    .default("JOURNEE"),
  dureeHeures: z
    .number()
    .min(0)
    .max(24)
    .optional(),
  matiereId: z.string().optional(),
  justifiee: z.boolean().default(false),
  motif: z.string().optional(),
  document: z.string().optional(),
});

export type CreateAbsenceInput = z.infer<typeof createAbsenceSchema>;

export const updateAbsenceSchema = createAbsenceSchema.partial();

export type UpdateAbsenceInput = z.infer<typeof updateAbsenceSchema>;

export const justifierAbsenceSchema = z.object({
  justifiee: z.literal(true),
  motif: z
    .string()
    .min(1, "Le motif est requis pour justifier une absence"),
  document: z.string().optional(),
});

export type JustifierAbsenceInput = z.infer<typeof justifierAbsenceSchema>;

export const batchAbsencesSchema = z.object({
  dateAbsence: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  periode: z
    .enum(["MATIN", "APRES_MIDI", "JOURNEE"])
    .default("JOURNEE"),
  eleveIds: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un élève"),
  matiereId: z.string().optional(),
});

export type BatchAbsencesInput = z.infer<typeof batchAbsencesSchema>;
