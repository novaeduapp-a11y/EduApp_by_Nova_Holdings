import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";

// GET /api/evaluations/[id] - Récupérer une évaluation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: {
        matiere: { select: { id: true, nom: true, code: true } },
        classe: { select: { id: true, nom: true } },
        periode: { select: { id: true, nom: true } },
        notes: {
          include: {
            eleve: { select: { id: true, nom: true, prenom: true, matricule: true } },
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Évaluation non trouvée" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: evaluation });
  } catch (error) {
    console.error("Erreur GET /api/evaluations/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// DELETE /api/evaluations/[id] - Supprimer une évaluation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    // Vérifier que l'évaluation existe
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: params.id },
      include: { _count: { select: { notes: true } } },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Évaluation non trouvée" } },
        { status: 404 }
      );
    }

    // Supprimer les notes associées d'abord
    await prisma.note.deleteMany({
      where: { evaluationId: params.id },
    });

    // Supprimer l'évaluation
    await prisma.evaluation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Évaluation supprimée" });
  } catch (error) {
    console.error("Erreur DELETE /api/evaluations/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
