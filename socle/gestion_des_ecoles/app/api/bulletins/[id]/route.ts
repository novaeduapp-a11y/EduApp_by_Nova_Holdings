import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";

// GET /api/bulletins/[id] - Détail d'un bulletin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const bulletin = await prisma.bulletin.findUnique({
      where: { id: params.id },
      include: {
        eleve: {
          include: {
            classe: true,
            moyennesGenerales: true,
          },
        },
        periode: true,
        user: {
          select: { nom: true, prenom: true },
        },
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Bulletin non trouvé" } },
        { status: 404 }
      );
    }

    // Trouver la moyenne générale pour cette période
    const moyenneGenerale = bulletin.eleve.moyennesGenerales.find(
      (m) => m.periodeId === bulletin.periodeId
    );

    // Formater la réponse avec les données de moyenne
    const response = {
      ...bulletin,
      moyenneGenerale: moyenneGenerale ? {
        moyenne: Number(moyenneGenerale.moyenneGenerale),
        rang: moyenneGenerale.rangClasse,
        mention: moyenneGenerale.mention,
      } : null,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Erreur GET /api/bulletins/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
