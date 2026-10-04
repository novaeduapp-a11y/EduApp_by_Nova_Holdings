import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import { canAccessMatiere, evaluationWhere, getProfAssignments, groupedClasses } from "@/lib/prof-scope";

const createSchema = z.object({
  titre: z.string().min(3).max(120),
  type: z.enum(["DEVOIR", "COMPOSITION", "INTERROGATION", "TP"]),
  classeId: z.string().min(1),
  matiereId: z.string().min(1),
  periodeId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  coefficient: z.coerce.number().min(0.5).max(10).default(1),
  noteSur: z.coerce.number().min(5).max(20).default(20),
});

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

    const [evaluations, periodes] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        include: {
          classe: {
            select: {
              id: true,
              nom: true,
              niveau: true,
              _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
            },
          },
          matiere: { select: { id: true, nom: true } },
          periode: { select: { id: true, nom: true } },
          _count: {
            select: {
              notes: {
                where: {
                  deletedAt: null,
                  OR: [{ absent: true }, { note: { not: null } }],
                },
              },
            },
          },
        },
        orderBy: { dateEvaluation: "desc" },
      }),
      prisma.periode.findMany({ orderBy: { ordre: "asc" } }),
    ]);

    return NextResponse.json({
      data: evaluations.map((evaluation) => ({
        id: evaluation.id,
        titre: evaluation.titre,
        type: evaluation.type,
        noteSur: Number(evaluation.noteSur),
        coefficient: Number(evaluation.coefficient),
        date: evaluation.dateEvaluation.toISOString(),
        classe: { id: evaluation.classe.id, nom: evaluation.classe.nom, niveau: evaluation.classe.niveau },
        matiere: evaluation.matiere,
        periode: evaluation.periode,
        notesSaisies: evaluation._count.notes,
        effectif: evaluation.classe._count.eleves,
      })),
      periodes: periodes.map((periode) => ({
        id: periode.id,
        nom: periode.nom,
        actif: periode.actif,
      })),
      affectations: groupedClasses(assignments).map((classe) => ({
        id: classe.id,
        nom: classe.nom,
        niveau: classe.niveau,
        effectif: classe.effectif,
        matieres: classe.matieres,
      })),
    });
  } catch (error) {
    console.error("Erreur évaluations professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Titre, classe, matière et date sont requis" }, { status: 400 });
    }

    if (!canAccessMatiere(assignments, parsed.data.classeId, parsed.data.matiereId)) {
      return NextResponse.json({ error: "Cette matière n’est pas dans vos affectations" }, { status: 403 });
    }

    let periodeId = parsed.data.periodeId ?? "";
    if (!periodeId) {
      const active = await prisma.periode.findFirst({ where: { actif: true }, orderBy: { numero: "desc" } });
      periodeId = active?.id ?? "";
    }
    if (!periodeId) {
      return NextResponse.json({ error: "Aucune période active" }, { status: 400 });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        titre: parsed.data.titre.trim(),
        type: parsed.data.type,
        classeId: parsed.data.classeId,
        matiereId: parsed.data.matiereId,
        periodeId,
        professeurId: authResult.user.id,
        dateEvaluation: new Date(`${parsed.data.date}T12:00:00.000Z`),
        coefficient: parsed.data.coefficient,
        noteSur: parsed.data.noteSur,
      },
    });

    return NextResponse.json({ data: { id: evaluation.id } }, { status: 201 });
  } catch (error) {
    console.error("Erreur création évaluation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
