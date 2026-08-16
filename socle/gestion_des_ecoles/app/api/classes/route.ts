import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagement, requireStaff } from "@/lib/permissions";
import { z } from "zod";

const createClasseSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  niveau: z.string().min(1, "Le niveau est requis"),
  effectifMax: z.number().min(1).max(100).default(30),
  cycleId: z.string().min(1, "Le cycle est requis"),
  anneeScolaire: z.string().default("2025-2026"),
});

// GET /api/classes - Liste des classes
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const anneeScolaire = searchParams.get("anneeScolaire") || "2025-2026";

    const classes = await prisma.classe.findMany({
      where: { anneeScolaire },
      include: {
        cycle: true,
        _count: { select: { eleves: true } },
      },
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    console.error("Erreur GET /api/classes:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// POST /api/classes - Créer une classe
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validation = createClasseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: validation.error.issues[0].message } },
        { status: 400 }
      );
    }

    const classe = await prisma.classe.create({
      data: validation.data,
      include: { cycle: true, _count: { select: { eleves: true } } },
    });

    return NextResponse.json({ success: true, data: classe }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/classes:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
