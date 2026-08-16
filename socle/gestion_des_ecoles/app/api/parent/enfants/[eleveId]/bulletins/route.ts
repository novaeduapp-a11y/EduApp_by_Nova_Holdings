import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const { eleveId } = params;

    const parentEleve = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: {
          parentId: authResult.user.id,
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
          fichierPdf: `/api/parent/enfants/${eleveId}/bulletins/${b.id}/pdf`,
        };
      }),
    });
  } catch (error) {
    console.error("Erreur récupération bulletins:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
