import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les notes d'un enfant
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

    // Récupérer les notes de l'élève
    const notes = await prisma.note.findMany({
      where: { eleveId },
      include: {
        evaluation: {
          include: {
            matiere: true,
            periode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les moyennes par matière
    const moyennesMatieres = await prisma.moyenneMatiere.findMany({
      where: { eleveId },
      include: {
        matiere: true,
        periode: true,
      },
      orderBy: { periode: { numero: "desc" } },
    });

    // Récupérer les moyennes générales
    const moyennesGenerales = await prisma.moyenneGenerale.findMany({
      where: { eleveId },
      include: {
        periode: true,
      },
      orderBy: { periode: { numero: "desc" } },
    });

    return NextResponse.json({
      data: {
        notes: notes.map((n) => ({
          id: n.id,
          valeur: n.note,
          noteMax: n.evaluation.noteSur,
          evaluation: n.evaluation.titre,
          type: n.evaluation.type,
          date: n.evaluation.dateEvaluation,
          matiere: n.evaluation.matiere.nom,
          periode: n.evaluation.periode.nom,
        })),
        moyennesMatieres: moyennesMatieres.map((m) => ({
          matiere: m.matiere.nom,
          moyenne: m.moyenne,
          periode: m.periode.nom,
        })),
        moyennesGenerales: moyennesGenerales.map((m) => ({
          moyenne: m.moyenneGenerale,
          rang: m.rangClasse,
          mention: m.mention,
          periode: m.periode.nom,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur récupération notes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
