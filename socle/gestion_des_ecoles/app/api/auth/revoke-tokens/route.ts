import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/unified-auth";

/**
 * POST /api/auth/revoke-tokens - Révoquer tous les tokens mobiles de l'utilisateur
 * Force la reconnexion sur tous les appareils mobiles
 */
export async function POST() {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;

    // Créer une entrée de révocation
    await prisma.tokenRevocation.create({
      data: {
        userId: authResult.user.id,
        reason: "Révocation manuelle par l'utilisateur",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tous les tokens ont été révoqués. Reconnectez-vous sur vos appareils mobiles.",
    });
  } catch (error) {
    console.error("Erreur revoke-tokens:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
