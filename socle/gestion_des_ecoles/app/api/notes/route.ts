import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { z } from "zod";

const createNotesSchema = z.object({
  evaluationId: z.string().min(1),
  notes: z.array(z.object({
    eleveId: z.string().min(1),
    note: z.number().min(0).nullable().optional(),
    absent: z.boolean().default(false),
    commentaire: z.string().optional(),
  })),
});

// GET /api/notes - Liste des notes
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const evaluationId = searchParams.get("evaluationId");
    const eleveId = searchParams.get("eleveId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (evaluationId) where.evaluationId = evaluationId;
    if (eleveId) where.eleveId = eleveId;

    const notes = await prisma.note.findMany({
      where,
      include: {
        eleve: { select: { id: true, nom: true, prenom: true, matricule: true } },
        evaluation: { include: { matiere: true, periode: true } },
      },
      orderBy: { eleve: { nom: "asc" } },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("Erreur GET /api/notes:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// POST /api/notes - Saisir les notes (batch)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;
    const session = authResult.session;

    const body = await request.json();
    const validation = createNotesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Données invalides", details: validation.error.issues } },
        { status: 400 }
      );
    }

    const { evaluationId, notes } = validation.data;

    // Vérifier que l'évaluation existe
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Évaluation non trouvée" } },
        { status: 404 }
      );
    }

    // Upsert des notes (créer ou mettre à jour)
    const results = await Promise.all(
      notes.map(async (noteData) => {
        return prisma.note.upsert({
          where: {
            eleveId_evaluationId: {
              eleveId: noteData.eleveId,
              evaluationId,
            },
          },
          update: {
            note: noteData.absent ? null : noteData.note,
            absent: noteData.absent,
            commentaire: noteData.commentaire,
          },
          create: {
            eleveId: noteData.eleveId,
            evaluationId,
            note: noteData.absent ? null : noteData.note,
            absent: noteData.absent,
            commentaire: noteData.commentaire,
            saisiPar: session.user.id,
          },
        });
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Erreur POST /api/notes:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
