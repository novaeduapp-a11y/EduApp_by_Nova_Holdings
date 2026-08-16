import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessMatiere, forbiddenClasse, getProfAssignments } from "@/lib/prof-scope";

const schema = z.object({
  notes: z.array(
    z.object({
      eleveId: z.string().min(1),
      note: z.number().min(0).nullable().optional(),
      absent: z.boolean().default(false),
      commentaire: z.string().optional(),
    })
  ),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    }
    if (!canAccessMatiere(assignments, evaluation.classeId, evaluation.matiereId)) {
      return forbiddenClasse();
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const noteMax = Number(evaluation.noteSur);
    const eleves = await prisma.eleve.findMany({
      where: { classeId: evaluation.classeId, deletedAt: null, actif: true },
      select: { id: true },
    });
    const allowed = new Set(eleves.map((eleve) => eleve.id));

    for (const row of parsed.data.notes) {
      if (!allowed.has(row.eleveId)) {
        return NextResponse.json({ error: "Élève hors de cette classe" }, { status: 403 });
      }
      if (!row.absent && row.note != null && row.note > noteMax) {
        return NextResponse.json({ error: `Note supérieure à ${noteMax}` }, { status: 400 });
      }
    }

    const results = await Promise.all(
      parsed.data.notes.map((row) =>
        prisma.note.upsert({
          where: {
            eleveId_evaluationId: { eleveId: row.eleveId, evaluationId: evaluation.id },
          },
          update: {
            note: row.absent ? null : row.note ?? null,
            absent: row.absent,
            commentaire: row.commentaire,
            deletedAt: null,
          },
          create: {
            eleveId: row.eleveId,
            evaluationId: evaluation.id,
            note: row.absent ? null : row.note ?? null,
            absent: row.absent,
            commentaire: row.commentaire,
            saisiPar: authResult.user.id,
          },
        })
      )
    );

    return NextResponse.json({ data: { saved: results.length } });
  } catch (error) {
    console.error("Erreur saisie notes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
