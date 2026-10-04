import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessMatiere, forbiddenClasse, getProfAssignments } from "@/lib/prof-scope";
import { recalculerMoyennesPourClasse } from "@/lib/notes-moyennes";

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

    await recalculerMoyennesPourClasse(evaluation.classeId, evaluation.periodeId);

    const eleveIds = [...new Set(parsed.data.notes.map((row) => row.eleveId))];
    const [liens, matiere, elevesNotif] = await Promise.all([
      prisma.parentEleve.findMany({
        where: { eleveId: { in: eleveIds } },
        select: { parentId: true, eleveId: true },
      }),
      prisma.matiere.findUnique({
        where: { id: evaluation.matiereId },
        select: { nom: true },
      }),
      prisma.eleve.findMany({
        where: { id: { in: eleveIds } },
        select: { id: true, prenom: true, nom: true },
      }),
    ]);
    const nomById = new Map(elevesNotif.map((e) => [e.id, `${e.prenom} ${e.nom}`]));
    if (liens.length > 0) {
      await prisma.notification.createMany({
        data: liens.map((lien) => ({
          userId: lien.parentId,
          type: "note",
          title: `Note · ${nomById.get(lien.eleveId) ?? "élève"}`,
          message: `${matiere?.nom ?? "Matière"} · ${evaluation.titre} — visible dans EduParent.`,
          data: { eleveId: lien.eleveId, evaluationId: evaluation.id },
        })),
      });
    }

    return NextResponse.json({ data: { saved: results.length, parentsNotifies: liens.length } });
  } catch (error) {
    console.error("Erreur saisie notes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
