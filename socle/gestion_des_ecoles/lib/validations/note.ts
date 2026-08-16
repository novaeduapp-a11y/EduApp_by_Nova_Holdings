import { z } from "zod";

export const createEvaluationSchema = z.object({
  titre: z
    .string()
    .min(1, "Le titre est requis")
    .min(3, "Le titre doit contenir au moins 3 caractères"),
  type: z.enum(["DEVOIR", "COMPOSITION", "INTERROGATION", "TP"], {
    message: "Le type d'évaluation est requis",
  }),
  matiereId: z
    .string()
    .min(1, "La matière est requise"),
  classeId: z
    .string()
    .min(1, "La classe est requise"),
  periodeId: z
    .string()
    .min(1, "La période est requise"),
  dateEvaluation: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  noteSur: z
    .number()
    .min(1, "La note maximale doit être supérieure à 0")
    .max(100, "La note maximale ne peut pas dépasser 100")
    .default(20),
  coefficient: z
    .number()
    .min(0.5, "Le coefficient doit être au moins 0.5")
    .max(10, "Le coefficient ne peut pas dépasser 10")
    .default(1),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;

export const updateEvaluationSchema = createEvaluationSchema.partial();

export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

export const createNoteSchema = z.object({
  eleveId: z.string().min(1, "L'élève est requis"),
  evaluationId: z.string().min(1, "L'évaluation est requise"),
  note: z
    .number()
    .min(0, "La note ne peut pas être négative")
    .nullable()
    .optional(),
  absent: z.boolean().default(false),
  commentaire: z.string().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const batchNotesSchema = z.object({
  evaluationId: z.string().min(1),
  notes: z.array(
    z.object({
      eleveId: z.string().min(1),
      note: z.number().min(0).nullable().optional(),
      absent: z.boolean().default(false),
      commentaire: z.string().optional(),
    })
  ),
});

export type BatchNotesInput = z.infer<typeof batchNotesSchema>;
