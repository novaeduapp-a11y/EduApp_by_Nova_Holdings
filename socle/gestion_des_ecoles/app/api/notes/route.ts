import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProfesseur, checkProfesseurMatiere, isAuthFailure } from "@/lib/unified-auth";
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

// GET /api/notes - Liste des notes (avec isolation école/classe)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (isAuthFailure(authResult)) return authResult.response;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const evaluationId = searchParams.get("evaluationId");
    const eleveId = searchParams.get("eleveId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (evaluationId) where.evaluationId = evaluationId;
    if (eleveId) where.eleveId = eleveId;

    // Isolation par école
    if (!user.isAdmin && user.ecoleId) {
      where.eleve = { ecoleId: user.ecoleId };
    }

    // Pour les professeurs, filtrer par évaluations de leurs classes/matières
    if (!user.isAdmin && user.affectations) {
      const evaluationIds = await prisma.evaluation.findMany({
        where: {
          deletedAt: null,
          OR: user.affectations.map((a) => ({
            classeId: a.classeId,
            matiereId: a.matiereId,
          })),
        },
        select: { id: true },
      });
      
      if (evaluationIds.length > 0) {
        where.evaluationId = { in: evaluationIds.map((e) => e.id) };
      } else {
        where.id = { in: [] }; // Aucune évaluation accessible
      }
    }

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

// POST /api/notes - Saisir les notes (batch) avec validation stricte
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (isAuthFailure(authResult)) return authResult.response;
    const { user } = authResult;

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
      where: { id: evaluationId, deletedAt: null },
      include: {
        classe: { select: { ecoleId: true } },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Évaluation non trouvée" } },
        { status: 404 }
      );
    }

    // Vérifier l'accès à cette évaluation
    if (!user.isAdmin) {
      // Vérifier l'école
      if (user.ecoleId !== evaluation.classe.ecoleId) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Accès refusé à cette évaluation (école différente)" } },
          { status: 403 }
        );
      }

      // Vérifier que le professeur enseigne cette matière dans cette classe
      const canAccess = await checkProfesseurMatiere(
        user.id,
        evaluation.classeId,
        evaluation.matiereId
      );

      if (!canAccess) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Vous n'enseignez pas cette matière dans cette classe" } },
          { status: 403 }
        );
      }
    }

    const noteSur = Number(evaluation.noteSur);

    // Valider que toutes les notes sont <= noteSur
    for (const noteData of notes) {
      if (noteData.note !== null && noteData.note !== undefined && !noteData.absent) {
        if (noteData.note > noteSur) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: `La note ne peut pas dépasser ${noteSur}`,
              },
            },
            { status: 400 }
          );
        }
        if (noteData.note < 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: `Note invalide: ${noteData.note} est négative`,
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // Vérifier que tous les élèves appartiennent à la classe de l'évaluation
    const elevesIds = notes.map((n) => n.eleveId);
    const elevesInClasse = await prisma.eleve.findMany({
      where: {
        id: { in: elevesIds },
        classeId: evaluation.classeId,
        deletedAt: null,
        actif: true,
      },
      select: { id: true },
    });

    if (elevesInClasse.length !== elevesIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Certains élèves n'appartiennent pas à cette classe",
          },
        },
        { status: 400 }
      );
    }

    // Upsert des notes
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
            saisiPar: user.id,
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
