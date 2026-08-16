import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { z } from "zod";

const updateClasseSchema = z.object({
  nom: z.string().min(1).optional(),
  niveau: z.string().min(1).optional(),
  effectifMax: z.number().min(1).max(100).optional(),
  cycleId: z.string().optional(),
});

// GET /api/classes/[id] - Détail d'une classe
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const classe = await prisma.classe.findUnique({
      where: { id: params.id },
      include: {
        cycle: true,
        _count: { select: { eleves: true } },
      },
    });

    if (!classe) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Classe non trouvée" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: classe });
  } catch (error) {
    console.error("Erreur GET /api/classes/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Modifier une classe
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validation = updateClasseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: validation.error.issues[0].message } },
        { status: 400 }
      );
    }

    const classe = await prisma.classe.update({
      where: { id: params.id },
      data: validation.data,
      include: { cycle: true, _count: { select: { eleves: true } } },
    });

    return NextResponse.json({ success: true, data: classe });
  } catch (error) {
    console.error("Erreur PUT /api/classes/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Supprimer une classe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    // Vérifier si la classe a des élèves
    const classe = await prisma.classe.findUnique({
      where: { id: params.id },
      include: { _count: { select: { eleves: true } } },
    });

    if (classe && classe._count.eleves > 0) {
      return NextResponse.json(
        { success: false, error: { code: "HAS_STUDENTS", message: "Impossible de supprimer une classe avec des élèves" } },
        { status: 400 }
      );
    }

    await prisma.classe.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error) {
    console.error("Erreur DELETE /api/classes/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
