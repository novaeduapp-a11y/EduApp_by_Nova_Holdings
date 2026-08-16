import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagement } from "@/lib/permissions";

// POST /api/bulletins/recalculer-rangs - Recalculer les rangs d'une classe pour une période
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { classeId, periodeId } = body;

    if (!classeId || !periodeId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "classeId et periodeId sont requis" } },
        { status: 400 }
      );
    }

    // Récupérer toutes les moyennes générales de la classe pour cette période
    const moyennes = await prisma.moyenneGenerale.findMany({
      where: {
        periodeId,
        eleve: {
          classeId,
        },
      },
      include: {
        eleve: {
          select: { id: true, nom: true, prenom: true },
        },
      },
      orderBy: {
        moyenneGenerale: "desc",
      },
    });

    // Calculer et mettre à jour les rangs
    let currentRang = 0;
    let previousMoyenne: number | null = null;
    let sameRangCount = 0;

    for (const moyenne of moyennes) {
      const moyenneValue = Number(moyenne.moyenneGenerale);
      
      if (previousMoyenne === null || moyenneValue !== previousMoyenne) {
        currentRang += 1 + sameRangCount;
        sameRangCount = 0;
      } else {
        // Même moyenne = même rang
        sameRangCount++;
      }

      // Mettre à jour le rang dans la base de données
      await prisma.moyenneGenerale.update({
        where: { id: moyenne.id },
        data: { rangClasse: currentRang },
      });

      previousMoyenne = moyenneValue;
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Rangs recalculés pour ${moyennes.length} élèves`,
        count: moyennes.length,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/bulletins/recalculer-rangs:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
