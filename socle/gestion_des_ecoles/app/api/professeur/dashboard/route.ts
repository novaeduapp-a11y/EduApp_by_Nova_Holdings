import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { evaluationWhere, getProfAssignments, groupedClasses } from "@/lib/prof-scope";

export async function GET() {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const classes = groupedClasses(assignments);
    const evaluations = assignments.length
      ? await prisma.evaluation.findMany({
          where: evaluationWhere(assignments),
          include: {
            classe: true,
            matiere: true,
            _count: { select: { notes: true } },
          },
          orderBy: { dateEvaluation: "desc" },
        })
      : [];

    const effectifByClasse = new Map(classes.map((item) => [item.id, item.effectif]));
    const evaluationsEnAttente = evaluations.filter((evaluation) => {
      const effectif = effectifByClasse.get(evaluation.classeId) ?? 0;
      return evaluation._count.notes < effectif;
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        totalClasses: classes.length,
        totalEleves: classes.reduce((sum, item) => sum + item.effectif, 0),
        totalEvaluations: evaluations.length,
        evaluationsEnAttente,
        classes: assignments.map((item) => ({
          id: item.classeId,
          nom: item.classeNom,
          effectif: item.effectif,
          matiere: item.matiereNom,
        })),
        prochainesEvaluations: evaluations.slice(0, 5).map((evaluation) => ({
          id: evaluation.id,
          titre: evaluation.titre,
          classe: evaluation.classe.nom,
          matiere: evaluation.matiere.nom,
          date: evaluation.dateEvaluation.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Erreur dashboard professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
