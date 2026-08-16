import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Dashboard du professeur connecté
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "PROFESSEUR") {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    // Récupérer les classes où le professeur enseigne
    const classeMatieres = await prisma.classeMatiere.findMany({
      where: { professeurId: session.user.id },
      include: {
        classe: {
          include: {
            _count: { select: { eleves: { where: { deletedAt: null } } } },
          },
        },
        matiere: true,
      },
    });

    // Récupérer les évaluations du professeur
    const evaluations = await prisma.evaluation.findMany({
      where: { professeurId: session.user.id, deletedAt: null },
      include: {
        classe: true,
        matiere: true,
        _count: { select: { notes: true } },
      },
      orderBy: { dateEvaluation: "desc" },
    });

    // Compter les évaluations en attente de notes
    const evaluationsEnAttente = evaluations.filter(e => {
      const classeEffectif = classeMatieres.find(cm => cm.classeId === e.classeId)?.classe._count.eleves || 0;
      return e._count.notes < classeEffectif;
    }).length;

    // Total élèves
    const totalEleves = classeMatieres.reduce((acc, cm) => acc + cm.classe._count.eleves, 0);

    // Prochaines évaluations
    const prochainesEvaluations = evaluations
      .filter(e => new Date(e.dateEvaluation) >= new Date())
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        titre: e.titre,
        classe: e.classe.nom,
        matiere: e.matiere.nom,
        date: e.dateEvaluation.toISOString(),
      }));

    return NextResponse.json({
      data: {
        totalClasses: classeMatieres.length,
        totalEleves,
        totalEvaluations: evaluations.length,
        evaluationsEnAttente,
        classes: classeMatieres.map(cm => ({
          id: cm.classe.id,
          nom: cm.classe.nom,
          effectif: cm.classe._count.eleves,
          matiere: cm.matiere.nom,
        })),
        prochainesEvaluations,
      },
    });
  } catch (error) {
    console.error("Erreur dashboard professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
