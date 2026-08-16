import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { z } from "zod";

const createEvaluationSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  type: z.enum(["DEVOIR", "COMPOSITION", "INTERROGATION", "TP"]),
  matiereId: z.string().min(1, "La matière est requise"),
  classeId: z.string().min(1, "La classe est requise"),
  periodeId: z.string().min(1, "La période est requise"),
  dateEvaluation: z.string(),
  noteSur: z.number().min(1).max(100).default(20),
  coefficient: z.number().min(1).max(10).default(1),
});

// GET /api/evaluations - Liste des évaluations
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get("classeId");
    const matiereId = searchParams.get("matiereId");
    const periodeId = searchParams.get("periodeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (classeId) where.classeId = classeId;
    if (matiereId) where.matiereId = matiereId;
    if (periodeId) where.periodeId = periodeId;

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        include: {
          matiere: true,
          classe: true,
          periode: true,
          professeur: { select: { id: true, nom: true, prenom: true } },
          _count: { select: { notes: true } },
        },
        orderBy: { dateEvaluation: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.evaluation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: evaluations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur GET /api/evaluations:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// POST /api/evaluations - Créer une évaluation
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;
    const session = authResult.session;

    const body = await request.json();
    const validation = createEvaluationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Données invalides", details: validation.error.issues } },
        { status: 400 }
      );
    }

    const data = validation.data;

    const evaluation = await prisma.evaluation.create({
      data: {
        titre: data.titre,
        type: data.type,
        matiereId: data.matiereId,
        classeId: data.classeId,
        periodeId: data.periodeId,
        professeurId: session.user.id,
        dateEvaluation: new Date(data.dateEvaluation),
        noteSur: data.noteSur,
        coefficient: data.coefficient,
      },
      include: {
        matiere: true,
        classe: true,
        periode: true,
      },
    });

    return NextResponse.json({ success: true, data: evaluation }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/evaluations:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
