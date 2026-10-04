import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessMatiere, forbiddenClasse, getProfAssignments } from "@/lib/prof-scope";
import { recalculerMoyennesPourClasse } from "@/lib/notes-moyennes";

const patchSchema = z.object({
  titre: z.string().min(3).max(120).optional(),
  type: z.enum(["DEVOIR", "COMPOSITION", "INTERROGATION", "TP"]).optional(),
  periodeId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  coefficient: z.coerce.number().min(0.5).max(10).optional(),
  noteSur: z.coerce.number().min(5).max(20).optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
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
      include: {
        classe: { select: { id: true, nom: true } },
        matiere: { select: { id: true, nom: true } },
        periode: { select: { id: true, nom: true } },
      },
    });
    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    }
    if (!canAccessMatiere(assignments, evaluation.classeId, evaluation.matiereId)) {
      return forbiddenClasse();
    }

    const [eleves, notes] = await Promise.all([
      prisma.eleve.findMany({
        where: { classeId: evaluation.classeId, deletedAt: null, actif: true },
        select: { id: true, nom: true, prenom: true, matricule: true, sexe: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.note.findMany({
        where: { evaluationId: evaluation.id, deletedAt: null },
      }),
    ]);

    const notesByEleve = new Map(notes.map((note) => [note.eleveId, note]));

    return NextResponse.json({
      data: {
        id: evaluation.id,
        titre: evaluation.titre,
        type: evaluation.type,
        noteSur: Number(evaluation.noteSur),
        coefficient: Number(evaluation.coefficient),
        date: evaluation.dateEvaluation.toISOString(),
        classe: evaluation.classe,
        matiere: evaluation.matiere,
        periode: evaluation.periode,
        eleves: eleves.map((eleve) => {
          const note = notesByEleve.get(eleve.id);
          return {
            eleveId: eleve.id,
            nom: eleve.nom,
            prenom: eleve.prenom,
            matricule: eleve.matricule,
            sexe: eleve.sexe,
            note: note?.note == null ? null : Number(note.note),
            absent: note?.absent ?? false,
            commentaire: note?.commentaire ?? null,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Erreur détail évaluation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function loadOwnedEvaluation(userId: string, evaluationId: string) {
  const assignments = await getProfAssignments(userId);
  if (!assignments) return { error: NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 }) };

  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, deletedAt: null },
  });
  if (!evaluation) {
    return { error: NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 }) };
  }
  if (!canAccessMatiere(assignments, evaluation.classeId, evaluation.matiereId)) {
    return { error: forbiddenClasse() };
  }
  return { evaluation };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const loaded = await loadOwnedEvaluation(authResult.user.id, params.id);
    if ("error" in loaded && loaded.error) return loaded.error;
    const evaluation = loaded.evaluation!;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    if (parsed.data.noteSur != null) {
      const tooHigh = await prisma.note.findFirst({
        where: {
          evaluationId: evaluation.id,
          deletedAt: null,
          absent: false,
          note: { gt: parsed.data.noteSur },
        },
      });
      if (tooHigh) {
        return NextResponse.json(
          { error: `Des notes dépassent le nouveau barème (${parsed.data.noteSur})` },
          { status: 400 }
        );
      }
    }

    const nextPeriode = parsed.data.periodeId ?? evaluation.periodeId;
    const updated = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        ...(parsed.data.titre ? { titre: parsed.data.titre.trim() } : {}),
        ...(parsed.data.type ? { type: parsed.data.type } : {}),
        ...(parsed.data.periodeId ? { periodeId: parsed.data.periodeId } : {}),
        ...(parsed.data.date ? { dateEvaluation: new Date(`${parsed.data.date}T12:00:00.000Z`) } : {}),
        ...(parsed.data.coefficient != null ? { coefficient: parsed.data.coefficient } : {}),
        ...(parsed.data.noteSur != null ? { noteSur: parsed.data.noteSur } : {}),
      },
    });

    const shouldRecalc =
      parsed.data.coefficient != null ||
      parsed.data.noteSur != null ||
      (parsed.data.periodeId && parsed.data.periodeId !== evaluation.periodeId);

    if (shouldRecalc) {
      if (nextPeriode !== evaluation.periodeId) {
        await recalculerMoyennesPourClasse(evaluation.classeId, evaluation.periodeId);
      }
      await recalculerMoyennesPourClasse(evaluation.classeId, nextPeriode);
    }

    return NextResponse.json({ data: { id: updated.id } });
  } catch (error) {
    console.error("Erreur modification évaluation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const loaded = await loadOwnedEvaluation(authResult.user.id, params.id);
    if ("error" in loaded && loaded.error) return loaded.error;
    const evaluation = loaded.evaluation!;

    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { deletedAt: new Date() },
    });
    await recalculerMoyennesPourClasse(evaluation.classeId, evaluation.periodeId);

    return NextResponse.json({ data: { id: evaluation.id } });
  } catch (error) {
    console.error("Erreur suppression évaluation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
