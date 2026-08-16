import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";

// GET /api/bulletins - Récupérer les bulletins
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get("classeId");
    const periodeId = searchParams.get("periodeId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (classeId) {
      where.eleve = { classeId };
    }

    if (periodeId) {
      where.periodeId = periodeId;
    }

    if (search) {
      where.eleve = {
        ...((where.eleve as object) || {}),
        OR: [
          { nom: { contains: search, mode: "insensitive" } },
          { prenom: { contains: search, mode: "insensitive" } },
          { matricule: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const bulletins = await prisma.bulletin.findMany({
      where,
      include: {
        eleve: {
          include: {
            classe: true,
            moyennesGenerales: {
              where: periodeId ? { periodeId } : undefined,
              take: 1,
            },
          },
        },
        periode: true,
        user: {
          select: { nom: true, prenom: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transformer les données pour l'affichage
    const bulletinsFormatted = bulletins.map((b) => {
      const moyenneGenerale = b.eleve.moyennesGenerales[0];
      return {
        id: b.id,
        eleveId: b.eleveId,
        periodeId: b.periodeId,
        eleve: `${b.eleve.prenom} ${b.eleve.nom}`,
        matricule: b.eleve.matricule,
        classe: b.eleve.classe?.nom || "",
        periode: b.periode.nom,
        moyenne: moyenneGenerale?.moyenneGenerale ? Number(moyenneGenerale.moyenneGenerale) : null,
        rang: moyenneGenerale?.rangClasse || null,
        mention: moyenneGenerale?.mention || null,
        tokenQr: b.tokenQr,
        date: b.createdAt.toISOString(),
        generePar: b.user ? `${b.user.prenom} ${b.user.nom}` : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: bulletinsFormatted,
    });
  } catch (error) {
    console.error("Erreur GET /api/bulletins:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
