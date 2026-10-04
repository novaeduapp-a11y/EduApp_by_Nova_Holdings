import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthFailure } from "@/lib/unified-auth";

// GET /api/bulletins - Récupérer les bulletins (avec isolation école/classe)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["ADMIN", "PROFESSEUR", "PREFET", "DIRECTEUR"]);
    if (isAuthFailure(authResult)) return authResult.response;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get("classeId");
    const periodeId = searchParams.get("periodeId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // Isolation par école
    if (user.role !== "ADMIN" && user.ecoleId) {
      where.eleve = { ecoleId: user.ecoleId };
    }

    // Pour les préfets, filtrer par cycle
    if (user.role === "PREFET" && "familleCycle" in user && user.familleCycle) {
      where.eleve = {
        ...(where.eleve as object || {}),
        classe: { cycle: { famille: user.familleCycle } },
      };
    }

    // Pour les professeurs, filtrer par leurs classes
    if (user.role === "PROFESSEUR" && "affectations" in user && Array.isArray(user.affectations)) {
      const classeIds = [...new Set(user.affectations.map((a) => a.classeId))];
      if (classeIds.length > 0) {
        where.eleve = {
          ...(where.eleve as object || {}),
          classeId: { in: classeIds },
        };
      } else {
        where.id = { in: [] }; // Aucune classe accessible
      }
    }

    if (classeId) {
      where.eleve = { ...(where.eleve as object || {}), classeId };
    }

    if (periodeId) {
      where.periodeId = periodeId;
    }

    if (search) {
      where.eleve = {
        ...(where.eleve as object || {}),
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
