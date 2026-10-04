import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  userId: z.string().min(1),
  currentPassword: z.string().optional(), // Optional si c'est un premier changement forcé
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

/**
 * POST /api/auth/change-password - Changer le mot de passe (pour changement forcé ou volontaire)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Données invalides",
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { userId, currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, mustChangePassword: true, actif: true },
    });

    if (!user || !user.actif) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Utilisateur introuvable" } },
        { status: 404 }
      );
    }

    // Si ce n'est pas un changement forcé, vérifier le mot de passe actuel
    if (!user.mustChangePassword && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_PASSWORD", message: "Mot de passe actuel incorrect" } },
          { status: 401 }
        );
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et retirer le flag mustChangePassword
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    // Révoquer tous les tokens existants pour forcer une reconnexion
    await prisma.tokenRevocation.create({
      data: {
        userId: user.id,
        reason: "Changement de mot de passe",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mot de passe changé avec succès. Veuillez vous reconnecter.",
    });
  } catch (error) {
    console.error("Erreur change-password:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
