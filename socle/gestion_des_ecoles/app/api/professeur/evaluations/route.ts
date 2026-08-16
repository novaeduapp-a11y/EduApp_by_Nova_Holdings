import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { evaluationWhere, getProfAssignments } from "@/lib/prof-scope";

export async function GET() {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const evaluations = assignments.length
      ? await prisma.evaluation.findMany({
          where: evaluationWhere(assignments),
          include: {
            classe: { select: { id: true, nom: true } },
            matiere: { select: { id: true, nom: true } },
          },
          orderBy: { dateEvaluation: "desc" },
        })
      : [];

    return NextResponse.json({
      success: true,
      data: evaluations.map((evaluation) => ({
        id: evaluation.id,
        titre: evaluation.titre,
        type: evaluation.type,
        noteSur: Number(evaluation.noteSur),
        classe: evaluation.classe,
        matiere: evaluation.matiere,
      })),
    });
  } catch (error) {
    console.error("Erreur évaluations professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
