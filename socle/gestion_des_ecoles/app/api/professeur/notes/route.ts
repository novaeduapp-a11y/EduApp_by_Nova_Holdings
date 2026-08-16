import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessMatiere, forbiddenClasse, getProfAssignments } from "@/lib/prof-scope";

const schema = z.object({
  evaluationId: z.string().min(1),
  notes: z.array(
    z.object({
      eleveId: z.string().min(1),
      note: z.number().min(0).nullable().optional(),
      absent: z.boolean().default(false),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: "Données invalides" } }, { status: 400 });
    }

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { id: parsed.data.evaluationId, deletedAt: null },
    });
    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    }
    if (!canAccessMatiere(assignments, evaluation.classeId, evaluation.matiereId)) {
      return forbiddenClasse();
    }

    const eleves = await prisma.eleve.findMany({
      where: { classeId: evaluation.classeId, deletedAt: null, actif: true },
      select: { id: true },
    });
    const allowed = new Set(eleves.map((eleve) => eleve.id));

    await Promise.all(
      parsed.data.notes.map((row) => {
        if (!allowed.has(row.eleveId)) return Promise.resolve(null);
        return prisma.note.upsert({
          where: {
            eleveId_evaluationId: { eleveId: row.eleveId, evaluationId: evaluation.id },
          },
          update: {
            note: row.absent ? null : row.note ?? null,
            absent: row.absent,
            deletedAt: null,
          },
          create: {
            eleveId: row.eleveId,
            evaluationId: evaluation.id,
            note: row.absent ? null : row.note ?? null,
            absent: row.absent,
            saisiPar: authResult.user.id,
          },
        });
      })
    );

    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (error) {
    console.error("Erreur saisie notes web:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
