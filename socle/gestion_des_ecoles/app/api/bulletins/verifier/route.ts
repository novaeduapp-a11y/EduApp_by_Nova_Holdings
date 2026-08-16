import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/bulletins/verifier - Vérifier un bulletin par son code QR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Code de vérification requis" } },
        { status: 400 }
      );
    }

    const bulletin = await prisma.bulletin.findFirst({
      where: { tokenQr: code },
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
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          message: "Code de vérification invalide. Ce bulletin n'existe pas dans notre système.",
        },
      });
    }

    // Trouver la moyenne générale pour cette période
    const moyenneGenerale = bulletin.eleve.moyennesGenerales.find(
      (m) => m.periodeId === bulletin.periodeId
    );

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        message: "Bulletin authentique",
        bulletin: {
          id: bulletin.id,
          eleve: {
            nom: bulletin.eleve.nom,
            prenom: bulletin.eleve.prenom,
            matricule: bulletin.eleve.matricule,
            classe: bulletin.eleve.classe?.nom,
          },
          periode: bulletin.periode.nom,
          anneeScolaire: bulletin.periode.anneeScolaire,
          moyenne: moyenneGenerale?.moyenneGenerale ? Number(moyenneGenerale.moyenneGenerale) : null,
          rang: moyenneGenerale?.rangClasse || null,
          mention: moyenneGenerale?.mention || null,
          dateGeneration: bulletin.createdAt,
          generePar: bulletin.user ? `${bulletin.user.prenom} ${bulletin.user.nom}` : null,
        },
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/bulletins/verifier:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
