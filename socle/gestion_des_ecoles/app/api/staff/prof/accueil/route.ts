import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { evaluationWhere, getProfAssignments, groupedClasses } from "@/lib/prof-scope";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

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

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      include: { ecole: true },
    });

    return NextResponse.json({
      data: {
        typeProfesseur: user?.typeProfesseur ?? null,
        ecole: user?.ecole ? { id: user.ecole.id, nom: user.ecole.nom, ville: user.ecole.ville } : null,
        totalClasses: classes.length,
        totalEleves: classes.reduce((sum, item) => sum + item.effectif, 0),
        totalEvaluations: evaluations.length,
        evaluationsEnAttente,
        classes: classes.map((item) => ({
          id: item.id,
          nom: item.nom,
          niveau: item.niveau,
          effectif: item.effectif,
          matieres: item.matieres.map((matiere) => matiere.nom),
        })),
        evaluations: evaluations.slice(0, 6).map((evaluation) => ({
          id: evaluation.id,
          titre: evaluation.titre,
          type: evaluation.type,
          classe: evaluation.classe.nom,
          matiere: evaluation.matiere.nom,
          date: evaluation.dateEvaluation.toISOString(),
          notesSaisies: evaluation._count.notes,
          effectif: effectifByClasse.get(evaluation.classeId) ?? 0,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur accueil professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
