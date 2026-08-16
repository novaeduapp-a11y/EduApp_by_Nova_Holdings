import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Notes de l'élève connecté
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

    // Récupérer les notes
    const notes = await prisma.note.findMany({
      where: { eleveId: eleve.id },
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
      where: { eleveId: eleve.id },
      include: {
        matiere: true,
        periode: true,
      },
      orderBy: { periode: { numero: "desc" } },
    });

    // Récupérer les moyennes générales
    const moyennesGenerales = await prisma.moyenneGenerale.findMany({
      where: { eleveId: eleve.id },
      include: {
        periode: true,
      },
      orderBy: { periode: { numero: "desc" } },
    });

    return NextResponse.json({
      data: {
        notes: notes.map((n) => ({
          id: n.id,
          valeur: n.note ? Number(n.note) : 0,
          noteMax: Number(n.evaluation.noteSur),
          evaluation: n.evaluation.titre,
          type: n.evaluation.type,
          date: n.evaluation.dateEvaluation.toISOString(),
          matiere: n.evaluation.matiere.nom,
          periode: n.evaluation.periode.nom,
        })),
        moyennesMatieres: moyennesMatieres.map((m) => ({
          matiere: m.matiere.nom,
          moyenne: m.moyenne ? Number(m.moyenne) : 0,
          periode: m.periode.nom,
        })),
        moyennesGenerales: moyennesGenerales.map((m) => ({
          moyenne: m.moyenneGenerale ? Number(m.moyenneGenerale) : 0,
          rang: m.rangClasse,
          mention: m.mention,
          periode: m.periode.nom,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur notes élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
