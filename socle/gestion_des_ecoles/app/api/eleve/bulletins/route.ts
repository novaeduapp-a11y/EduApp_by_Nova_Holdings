import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Bulletins de l'élève connecté
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'élève lié à ce compte
    const eleve = await prisma.eleve.findUnique({
      where: { userId: session.user.id },
    });

    if (!eleve) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    // Récupérer les bulletins avec les moyennes générales
    const bulletins = await prisma.bulletin.findMany({
      where: { eleveId: eleve.id },
      include: {
        periode: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les moyennes générales pour chaque période
    const moyennesGenerales = await prisma.moyenneGenerale.findMany({
      where: { eleveId: eleve.id },
    });

    const moyennesMap = new Map(
      moyennesGenerales.map(m => [m.periodeId, m])
    );

    return NextResponse.json({
      data: bulletins.map((b) => {
        const moyenne = moyennesMap.get(b.periodeId);
        return {
          id: b.id,
          periode: b.periode.nom,
          moyenne: moyenne?.moyenneGenerale ? Number(moyenne.moyenneGenerale) : null,
          rang: moyenne?.rangClasse || null,
          mention: moyenne?.mention || null,
          fichierPdf: b.fichierPdf,
          createdAt: b.createdAt.toISOString(),
        };
      }),
    });
  } catch (error) {
    console.error("Erreur bulletins élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
