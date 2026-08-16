import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "L'email ou le téléphone est requis"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  nom: z
    .string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z
    .string()
    .min(1, "Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["ADMIN", "DIRECTEUR", "PROFESSEUR"], {
    message: "Le rôle est requis",
  }),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  photo: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  actif: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Le mot de passe actuel est requis"),
  newPassword: z
    .string()
    .min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z
    .string()
    .min(1, "La confirmation est requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
