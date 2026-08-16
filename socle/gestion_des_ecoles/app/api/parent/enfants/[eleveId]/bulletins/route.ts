import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les bulletins d'un enfant
export async function GET(
  request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { eleveId } = params;

    // Vérifier que le parent a accès à cet élève
    const parentEleve = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: {
          parentId: session.user.id,
          eleveId: eleveId,
        },
      },
    });

    if (!parentEleve) {
      return NextResponse.json({ error: "Accès non autorisé à cet élève" }, { status: 403 });
    }

    // Récupérer les bulletins de l'élève avec les moyennes générales
    const bulletins = await prisma.bulletin.findMany({
      where: { eleveId },
      include: {
        periode: true,
        eleve: {
          include: {
            classe: true,
          },
        },
      },
      orderBy: { periode: { numero: "desc" } },
    });

    // Récupérer les moyennes générales pour chaque période
    const moyennesGenerales = await prisma.moyenneGenerale.findMany({
      where: { eleveId },
      include: { periode: true },
    });

    return NextResponse.json({
      data: bulletins.map((b) => {
        const moyenneGenerale = moyennesGenerales.find(
          (m) => m.periodeId === b.periodeId
        );
        return {
          id: b.id,
          periode: b.periode.nom,
          periodeNumero: b.periode.numero,
          moyenne: moyenneGenerale?.moyenneGenerale || null,
          rang: moyenneGenerale?.rangClasse || null,
          mention: moyenneGenerale?.mention || null,
          qrCode: b.tokenQr,
          dateGeneration: b.createdAt,
          classe: b.eleve.classe.nom,
          fichierPdf: b.fichierPdf,
        };
      }),
    });
  } catch (error) {
    console.error("Erreur récupération bulletins:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
