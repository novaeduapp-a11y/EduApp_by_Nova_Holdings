import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessMatiere, evaluationWhere, getProfAssignments } from "@/lib/prof-scope";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get("classeId");
    const matiereId = searchParams.get("matiereId");

    if (classeId && matiereId && !canAccessMatiere(assignments, classeId, matiereId)) {
      return NextResponse.json({ error: "Accès non autorisé à cette matière" }, { status: 403 });
    }

    const where = {
      ...evaluationWhere(assignments),
      ...(classeId ? { classeId } : {}),
      ...(matiereId ? { matiereId } : {}),
    };

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        classe: { select: { id: true, nom: true } },
        matiere: { select: { id: true, nom: true } },
        periode: { select: { id: true, nom: true } },
        _count: { select: { notes: true } },
      },
      orderBy: { dateEvaluation: "desc" },
    });

    return NextResponse.json({
      data: evaluations.map((evaluation) => ({
        id: evaluation.id,
        titre: evaluation.titre,
        type: evaluation.type,
        noteSur: Number(evaluation.noteSur),
        coefficient: Number(evaluation.coefficient),
        date: evaluation.dateEvaluation.toISOString(),
        classe: evaluation.classe,
        matiere: evaluation.matiere,
        periode: evaluation.periode,
        notesSaisies: evaluation._count.notes,
      })),
    });
  } catch (error) {
    console.error("Erreur évaluations professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
